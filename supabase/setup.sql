-- =============================================================================
-- TRANSCEND WebGIS · validaciones de campo (Supabase / PostGIS)
-- Ejecutar una sola vez: Supabase › SQL Editor › New query › pegar todo › Run.
-- Se puede volver a ejecutar sin perder datos.
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
  id           uuid primary key,
  client_id    uuid not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  received_at  timestamptz not null default now(),
  consent_at   timestamptz not null,
  user_name    text not null check (char_length(user_name) between 1 and 200),
  user_email   text not null check (char_length(user_email) <= 254 and user_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  institution  text not null check (char_length(institution) between 1 and 200),
  job_title    text not null check (char_length(job_title) between 1 and 200),
  land_class   text not null check (land_class in
                 ('agri_irrigada', 'agri_secano', 'veg_natural', 'pastizal', 'humedal', 'suelo_roca')),
  crop         text check (crop in
                 ('papa', 'papa_amarga', 'quinua', 'canahua', 'cebada_grano', 'cebada_forrajera', 'avena_forrajera',
                  'alfalfa', 'pasto_cultivado', 'haba', 'arveja', 'oca', 'olluco', 'isano', 'tarwi', 'trigo', 'maiz',
                  'hortalizas', 'descanso', 'no_ident', 'otro')),
  crop_other   text check (char_length(crop_other) <= 200),
  notes        text check (char_length(notes) <= 2000),
  geom_type    text not null check (geom_type in ('Point', 'Polygon')),
  area_ha      double precision,
  lang         text,
  geom         geometry(Geometry, 4326) not null,
  -- el cultivo es obligatorio solo en las dos clases de agricultura
  constraint crop_only_for_agri check ((land_class in ('agri_irrigada', 'agri_secano')) = (crop is not null))
);

comment on table public.validations is 'Validaciones de cobertura enviadas desde el TRANSCEND WebGIS (datos personales: acceso solo del responsable del proyecto)';
create index if not exists validations_geom_idx  on public.validations using gist (geom);
create index if not exists validations_email_idx on public.validations (user_email);
create index if not exists validations_class_idx on public.validations (land_class);

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
  if (p ->> 'consent_at') is null or (p ->> 'consent_at')::timestamptz > now() + interval '1 day' then
    raise exception 'consent required';
  end if;

  insert into public.validations as v
    (id, client_id, created_at, updated_at, consent_at, user_name, user_email, institution, job_title,
     land_class, crop, crop_other, notes, geom_type, area_ha, lang, geom)
  values (
    (p ->> 'id')::uuid,
    (p ->> 'client_id')::uuid,
    least(coalesce((p ->> 'created_at')::timestamptz, now()), now() + interval '1 day'),
    least(coalesce((p ->> 'updated_at')::timestamptz, now()), now() + interval '1 day'),
    (p ->> 'consent_at')::timestamptz,
    trim(p ->> 'user_name'),
    lower(trim(p ->> 'user_email')),
    trim(p ->> 'institution'),
    trim(p ->> 'job_title'),
    p ->> 'land_class',
    nullif(p ->> 'crop', ''),
    nullif(trim(p ->> 'crop_other'), ''),
    nullif(trim(p ->> 'notes'), ''),
    case when GeometryType(g) = 'POINT' then 'Point' else 'Polygon' end,
    case when GeometryType(g) = 'POLYGON' then ST_Area(g::geography) / 10000 end,
    left(p ->> 'lang', 5),
    g)
  on conflict (id) do update set
    updated_at  = excluded.updated_at,
    received_at = now(),
    consent_at  = excluded.consent_at,
    user_name   = excluded.user_name,
    user_email  = excluded.user_email,
    institution = excluded.institution,
    job_title   = excluded.job_title,
    land_class  = excluded.land_class,
    crop        = excluded.crop,
    crop_other  = excluded.crop_other,
    notes       = excluded.notes,
    geom_type   = excluded.geom_type,
    area_ha     = excluded.area_ha,
    geom        = excluded.geom
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
grant execute on function public.rate_limit_check(text)       to service_role;
grant execute on function public.submit_validation(jsonb)      to service_role;
grant execute on function public.delete_validation(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
