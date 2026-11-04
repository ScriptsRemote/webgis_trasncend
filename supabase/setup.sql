-- =============================================================================
-- TRANSCEND WebGIS · validaciones de campo (Supabase / PostGIS)
-- Ejecutar: Supabase › SQL Editor › New query › pegar todo › Run.
-- Se puede volver a ejecutar sin perder validaciones.
--
-- Versión 2 (nov. 2026): sin datos personales y con cuestionario estructurado.
--   * Del usuario solo se guardan la institución y el cargo general (job_title,
--     lista fija). Ya no se guardan nombre ni correo (GDPR).
--   * Respuestas: is_cropland (sí/no) → si es cultivo: crops (lista), irrigation
--     (si/no/no_sabe) y, con riego, irrigation_type y water_source (listas);
--     si no es cultivo: land_cover (+ land_cover_other si es «otro»).
--   * Polígonos de hasta 500 ha.
--   Si la tabla ya existe (versión 1), el bloque «actualización desde la
--   versión 1» convierte las respuestas antiguas (land_class / crop) y
--   ELIMINA las columnas user_name y user_email con su contenido.
--
-- Seguridad
--   * El sitio web NO tiene ninguna clave. Envía los datos al servidor del
--     proyecto (server/, en Render), que usa la clave
--     secreta guardada solo en sus variables de entorno.
--   * La tabla tiene RLS activo y sin políticas, y las claves públicas
--     (anon / publishable) no tienen ningún permiso: nadie de fuera puede leer,
--     escribir ni borrar. Solo el dueño del proyecto ve los datos (panel de
--     Supabase o QGIS con la contraseña de la base).
--   * Las funciones solo las puede ejecutar el rol service_role (el servidor).
--   * Límite de envíos por IP y total por día (rate_limit_check); la IP se guarda
--     solo como hash, nunca en texto.
-- =============================================================================

create extension if not exists postgis with schema extensions;
set search_path = public, extensions;

-- ----------------------------------------------------------------------------- tabla
create table if not exists public.validations (
  id               uuid primary key,
  client_id        uuid not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  received_at      timestamptz not null default now(),
  consent_at       timestamptz not null,
  institution      text not null check (char_length(institution) between 1 and 200),
  job_title        text not null,
  is_cropland      boolean,
  crops            text[],
  crop_other       text,
  irrigation       text,
  irrigation_type  text[],
  water_source     text[],
  land_cover       text,
  land_cover_other text,
  notes            text check (char_length(notes) <= 2000),
  geom_type        text not null check (geom_type in ('Point', 'Polygon')),
  area_ha          double precision,
  lang             text,
  geom             geometry(Geometry, 4326) not null
);

-- ----------------------------------------------------------------------------- actualización desde la versión 1
alter table public.validations
  add column if not exists is_cropland      boolean,
  add column if not exists crops            text[],
  add column if not exists irrigation       text,
  add column if not exists irrigation_type  text[],
  add column if not exists water_source     text[],
  add column if not exists land_cover       text,
  add column if not exists land_cover_other text;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'validations' and column_name = 'land_class') then
    -- agricultura irrigada / no irrigada → cultivo con riego (tipo y fuente: «no sabe») / a secano;
    -- las otras clases → cobertura; el cultivo «no identificado» pasa a «no sabe»
    update public.validations set
      is_cropland     = land_class in ('agri_irrigada', 'agri_secano'),
      crops           = case when land_class in ('agri_irrigada', 'agri_secano')
                          then array[case crop when 'no_ident' then 'no_sabe' else crop end] end,
      crop_other      = case when crop = 'otro' then crop_other end,
      irrigation      = case land_class when 'agri_irrigada' then 'si' when 'agri_secano' then 'no' end,
      irrigation_type = case when land_class = 'agri_irrigada' then array['no_sabe'] end,
      water_source    = case when land_class = 'agri_irrigada' then array['no_sabe'] end,
      land_cover      = case when land_class not in ('agri_irrigada', 'agri_secano') then land_class end
    where is_cropland is null;
    alter table public.validations drop constraint if exists crop_only_for_agri;
    alter table public.validations drop column land_class, drop column crop;
  end if;
end $$;

-- Datos personales de la versión 1: se eliminan (no se vuelven a pedir)
drop index if exists public.validations_email_idx;
alter table public.validations drop column if exists user_name, drop column if exists user_email;

-- ----------------------------------------------------------------------------- reglas de las respuestas
alter table public.validations alter column is_cropland set not null;
alter table public.validations
  drop constraint if exists job_title_ok,
  drop constraint if exists crops_ok,
  drop constraint if exists irrigation_ok,
  drop constraint if exists irrigation_type_ok,
  drop constraint if exists water_source_ok,
  drop constraint if exists land_cover_ok,
  drop constraint if exists texts_ok,
  drop constraint if exists answers_consistent,
  drop constraint if exists area_max;
-- «not valid»: valen para todo registro nuevo o actualizado; los cargos en texto libre
-- de la versión 1 se mantienen como están.
alter table public.validations
  add constraint job_title_ok check (job_title in
    ('tecnico', 'investigador', 'funcionario', 'ong', 'productor', 'estudiante', 'otro')) not valid,
  add constraint crops_ok check (cardinality(crops) between 1 and 21 and crops <@ array[
    'papa', 'papa_amarga', 'quinua', 'canahua', 'cebada_grano', 'cebada_forrajera', 'avena_forrajera',
    'alfalfa', 'pasto_cultivado', 'haba', 'arveja', 'oca', 'olluco', 'isano', 'tarwi', 'trigo', 'maiz',
    'hortalizas', 'descanso', 'otro', 'no_sabe']::text[]) not valid,
  add constraint irrigation_ok check (irrigation in ('si', 'no', 'no_sabe')) not valid,
  add constraint irrigation_type_ok check (cardinality(irrigation_type) between 1 and 5 and irrigation_type <@
    array['superficie', 'aspersion', 'goteo', 'otro', 'no_sabe']::text[]) not valid,
  add constraint water_source_ok check (cardinality(water_source) between 1 and 8 and water_source <@
    array['rio', 'lago', 'manantial', 'pozo', 'represa', 'qocha', 'otro', 'no_sabe']::text[]) not valid,
  add constraint land_cover_ok check (land_cover in ('veg_natural', 'pastizal', 'humedal', 'suelo_roca', 'otro')) not valid,
  add constraint texts_ok check (char_length(crop_other) <= 200 and char_length(land_cover_other) <= 200) not valid,
  -- cultivo → cultivos y riego (tipo y fuente solo con riego); no cultivo → cobertura
  add constraint answers_consistent check (
    case when is_cropland
      then crops is not null and irrigation is not null and land_cover is null and land_cover_other is null
           and (irrigation = 'si') = (irrigation_type is not null)
           and (irrigation = 'si') = (water_source is not null)
           and ('otro' = any(crops)) = (crop_other is not null)
      else land_cover is not null and crops is null and crop_other is null and irrigation is null
           and irrigation_type is null and water_source is null
           and (land_cover = 'otro') = (land_cover_other is not null)
    end) not valid,
  add constraint area_max check (area_ha <= 500) not valid;

comment on table public.validations is 'Validaciones del mapa de cultivo enviadas desde el TRANSCEND WebGIS (sin datos personales: solo institución y cargo general; acceso solo del equipo del proyecto)';
create index if not exists validations_geom_idx    on public.validations using gist (geom);
create index if not exists validations_cropland_idx on public.validations (is_cropland);
drop index if exists public.validations_class_idx;

alter table public.validations enable row level security;
revoke all on table public.validations from anon, authenticated;

-- ----------------------------------------------------------------------------- límite de envíos
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rate_hits (
  bucket text not null,                       -- hash de la IP (nunca la IP en texto)
  at     timestamptz not null default now()
);
create index if not exists rate_hits_bucket_idx on private.rate_hits (bucket, at);
create index if not exists rate_hits_at_idx     on private.rate_hits (at);

-- Devuelve true si la solicitud puede seguir. Límites: 20 por minuto y 300 por día
-- por IP; 5000 por día en total (protege contra envíos masivos desde muchas IP).
create or replace function public.rate_limit_check(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = private, public
as $$
begin
  if random() < 0.02 then
    delete from private.rate_hits where at < now() - interval '2 days';
  end if;
  if (select count(*) from private.rate_hits where bucket = p_ip and at > now() - interval '1 minute') >= 20
     or (select count(*) from private.rate_hits where bucket = p_ip and at > now() - interval '1 day') >= 300
     or (select count(*) from private.rate_hits where at > now() - interval '1 day') >= 5000 then
    return false;
  end if;
  insert into private.rate_hits (bucket) values (left(p_ip, 64));
  return true;
end;
$$;

-- ----------------------------------------------------------------------------- crear / actualizar
-- Lista JSON → text[] (null si no viene)
create or replace function public.jsonb_text_array(j jsonb)
returns text[]
language sql
immutable
set search_path = pg_catalog
as $$
  select case when jsonb_typeof(j) = 'array' then array(select jsonb_array_elements_text(j)) end;
$$;

create or replace function public.submit_validation(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  g geometry;
begin
  g := ST_SetSRID(ST_GeomFromGeoJSON((p -> 'geometry')::text), 4326);
  if GeometryType(g) not in ('POINT', 'POLYGON') then
    raise exception 'geometry must be a Point or a Polygon';
  end if;
  if not ST_IsValid(g) then
    raise exception 'invalid geometry';
  end if;
  -- área de trabajo: cuenca del Titicaca con margen amplio
  if not ST_Intersects(g, ST_MakeEnvelope(-74, -22, -64, -12, 4326)) then
    raise exception 'geometry outside the study region';
  end if;
  if ST_NPoints(g) > 5000 then
    raise exception 'polygon has too many vertices';
  end if;
  if GeometryType(g) = 'POLYGON' and ST_Area(g::geography) / 10000 > 500 then
    raise exception 'polygon larger than 500 ha';
  end if;
  if (p ->> 'consent_at') is null or (p ->> 'consent_at')::timestamptz > now() + interval '1 day' then
    raise exception 'consent required';
  end if;

  insert into public.validations as v
    (id, client_id, created_at, updated_at, consent_at, institution, job_title,
     is_cropland, crops, crop_other, irrigation, irrigation_type, water_source, land_cover, land_cover_other,
     notes, geom_type, area_ha, lang, geom)
  values (
    (p ->> 'id')::uuid,
    (p ->> 'client_id')::uuid,
    least(coalesce((p ->> 'created_at')::timestamptz, now()), now() + interval '1 day'),
    least(coalesce((p ->> 'updated_at')::timestamptz, now()), now() + interval '1 day'),
    (p ->> 'consent_at')::timestamptz,
    trim(p ->> 'institution'),
    p ->> 'job_title',
    (p ->> 'is_cropland')::boolean,
    public.jsonb_text_array(p -> 'crops'),
    nullif(trim(p ->> 'crop_other'), ''),
    p ->> 'irrigation',
    public.jsonb_text_array(p -> 'irrigation_type'),
    public.jsonb_text_array(p -> 'water_source'),
    p ->> 'land_cover',
    nullif(trim(p ->> 'land_cover_other'), ''),
    nullif(trim(p ->> 'notes'), ''),
    case when GeometryType(g) = 'POINT' then 'Point' else 'Polygon' end,
    case when GeometryType(g) = 'POLYGON' then ST_Area(g::geography) / 10000 end,
    left(p ->> 'lang', 5),
    g)
  on conflict (id) do update set
    updated_at       = excluded.updated_at,
    received_at      = now(),
    consent_at       = excluded.consent_at,
    institution      = excluded.institution,
    job_title        = excluded.job_title,
    is_cropland      = excluded.is_cropland,
    crops            = excluded.crops,
    crop_other       = excluded.crop_other,
    irrigation       = excluded.irrigation,
    irrigation_type  = excluded.irrigation_type,
    water_source     = excluded.water_source,
    land_cover       = excluded.land_cover,
    land_cover_other = excluded.land_cover_other,
    notes            = excluded.notes,
    geom_type        = excluded.geom_type,
    area_ha          = excluded.area_ha,
    geom             = excluded.geom
  where v.client_id = excluded.client_id;   -- solo el navegador que lo creó puede actualizarlo

  return (p ->> 'id')::uuid;
end;
$$;

-- ----------------------------------------------------------------------------- eliminar (solo el mismo navegador)
create or replace function public.delete_validation(p_id uuid, p_client uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with d as (delete from public.validations where id = p_id and client_id = p_client returning 1)
  select exists (select 1 from d);
$$;

-- ----------------------------------------------------------------------------- permisos
-- Nadie con clave pública ejecuta nada; solo el servidor (service_role).
revoke all on function public.rate_limit_check(text)          from public, anon, authenticated;
revoke all on function public.submit_validation(jsonb)         from public, anon, authenticated;
revoke all on function public.delete_validation(uuid, uuid)    from public, anon, authenticated;
revoke all on function public.jsonb_text_array(jsonb)          from public, anon, authenticated;
grant execute on function public.rate_limit_check(text)       to service_role;
grant execute on function public.submit_validation(jsonb)      to service_role;
grant execute on function public.delete_validation(uuid, uuid) to service_role;
grant execute on function public.jsonb_text_array(jsonb)       to service_role;

notify pgrst, 'reload schema';
