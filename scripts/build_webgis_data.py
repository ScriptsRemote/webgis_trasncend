# -*- coding: utf-8 -*-
"""
TRANSCEND WebGIS - preparação dos dados (Python 3 + geopandas + rasterio + pillow)
Gera Webgis/public/data/*.js (formato compacto lido pelo app), Webgis/public/data/download/*.geojson,
Webgis/public/data/meta.js e as teselas Webgis/public/tiles/{tdps,cropland}/{z}/{x}/{y}.png.

Uso:  pip install geopandas pyogrio rasterio pillow
      python build_webgis_data.py "C:/Users/b61237cs/Documents/TRANSCEND/3_FieldWork"

Rodovias e localidades da bacia: shared/osm_basin.gpkg, criado a partir de
shared/raw/osm_basin_main_roads_overpass.json (Overpass API, trunk/primary/secondary + city/town,
bbox -19.6,-71.2,-14.0,-66.3). Para atualizar, baixe o JSON de novo e apague osm_basin.gpkg.
"""
import sys, os, tempfile
BASE = sys.argv[1] if len(sys.argv) > 1 else r'C:/Users/b61237cs/Documents/TRANSCEND/3_FieldWork'
WEB = os.path.join(BASE, 'Webgis', 'public')
STAGE = os.path.join(tempfile.gettempdir(), 'transcend_webgis_stage.gpkg')
OSMB = os.path.join(BASE, 'shared', 'osm_basin.gpkg')
os.chdir(WEB)

# ================================================================ 0. OSM da bacia (JSON -> GeoPackage)
if not os.path.exists(OSMB):
    sys.argv = ['', os.path.join(BASE, 'shared', 'raw', 'osm_basin_main_roads_overpass.json'), OSMB]
    import json, geopandas as gpd, sys, os
    from shapely.geometry import LineString, Point
    src=sys.argv[1]; dst=sys.argv[2]
    d=json.load(open(src,encoding='utf-8'))
    cls={'motorway':'trunk','motorway_link':'trunk','trunk':'trunk','trunk_link':'trunk','primary':'primary','primary_link':'primary','secondary':'secondary'}
    R=[];P=[]
    for el in d['elements']:
        t=el.get('tags',{})
        if el['type']=='way' and 'geometry' in el and t.get('highway') in cls and len(el['geometry'])>1:
            R.append({'osm_id':el['id'],'highway':t['highway'],'road_class':cls[t['highway']],'ref':t.get('ref'),'name':t.get('name'),'surface':t.get('surface'),
                      'geometry':LineString([(g['lon'],g['lat']) for g in el['geometry']])})
        elif el['type']=='node' and t.get('place') in ('city','town') and 'name' in t:
            P.append({'osm_id':el['id'],'place':t['place'],'name':t['name'],'geometry':Point(el['lon'],el['lat'])})
    r=gpd.GeoDataFrame(R,crs=4326); p=gpd.GeoDataFrame(P,crs=4326)
    if os.path.exists(dst): os.remove(dst)
    r.to_file(dst,layer='osm_roads_main',driver='GPKG'); p.to_file(dst,layer='osm_places',driver='GPKG')
    print(r.road_class.value_counts().to_dict(), len(p))

# ================================================================ 1. recorte e atributos
import geopandas as gpd, pandas as pd, numpy as np, json, os, shapely
from shapely.geometry import mapping
from shapely import force_2d
U=BASE
SH=U+'/shared/shared_data.gpkg'; OSMB=globals().get('OSMB', U+'/shared/osm_basin.gpkg'); PE=U+'/Peru/data/Peru_data.gpkg'; BO=U+'/Bolivia/data/Bolivia_data.gpkg'

UTM='EPSG:32719'

def fix(g):
    g=g.copy(); g['geometry']=force_2d(g.geometry.make_valid()); return g

basin=fix(gpd.read_file(SH,layer='basin_desaguadero_mauri_caplina'))
basin=basin.dissolve()[['geometry']]
basin_utm=basin.to_crs(UTM)
basin_area=basin_utm.area.iloc[0]/1e6
print('basin km2',round(basin_area))
bgeom=basin.geometry.iloc[0]

# municipalities
bo=fix(gpd.read_file(BO,layer='municipalities'))
bo=gpd.GeoDataFrame({'name':bo['nombre_mun'],'country':'Bolivia','admin1':bo['nombre_dep'],'admin2':bo['nombre_prov'],'code':bo['codigo_ine']},geometry=bo.geometry,crs=bo.crs)
pe=fix(gpd.read_file(PE,layer='districts'))
pe=gpd.GeoDataFrame({'name':pe['name'],'country':'Peru','admin1':pe['region'],'admin2':pe['province'],'code':pe['pcode']},geometry=pe.geometry,crs=pe.crs)
mun=pd.concat([bo,pe],ignore_index=True)
mun=mun[mun.intersects(bgeom)].copy()
mu=mun.to_crs(UTM); inter=mu.intersection(basin_utm.geometry.iloc[0])
mun['area_km2']=(mu.area/1e6).round(1)
mun['pct_basin']=(inter.area/mu.area*100).round(1)
mun=mun[mun['pct_basin']>=1].copy()
print('munis', mun.groupby('country').size().to_dict())
study_bo=set(gpd.read_file(BO,layer='study_municipalities')['nombre_mun'])
study_pe=set(gpd.read_file(PE,layer='study_provinces')['name'])
import unicodedata
def sa(s): return ''.join(c for c in unicodedata.normalize('NFD',str(s)) if unicodedata.category(c)!='Mn').upper()
spe={sa(x) for x in study_pe}
mun['study']=[ (r.country=='Bolivia' and r['name'] in study_bo) or (r.country=='Peru' and sa(r.admin2) in spe) for _,r in mun.iterrows()]
print('study flag', mun.groupby(['country','study']).size().to_dict())

# roads
rd=gpd.read_file(OSMB,layer='osm_roads_main').drop_duplicates('osm_id')
rd=rd[rd.road_class.isin(['trunk','primary','secondary'])]
buf=basin_utm.buffer(10000).to_crs(4326).iloc[0]
rd=rd[rd.intersects(buf)].copy(); rd['geometry']=rd.intersection(buf)
rd=rd[~rd.geometry.is_empty]
print('roads', rd.road_class.value_counts().to_dict())
# places
pl=gpd.read_file(OSMB,layer='osm_places').drop_duplicates('osm_id')
pl=pl[pl.place.isin(['city','town']) & pl.within(buf)].copy()
print('places',len(pl))
# agriculture Peru (pre-survey 2026 / Living Lab, MINAGRI)
ap=fix(gpd.read_file(PE,layer='agriculture_livinglab'))
ap=gpd.GeoDataFrame({'province':ap['province'],'district':ap['NOMBDIST'].str.title(),'region':'Puno'},geometry=ap.geometry,crs=ap.crs)
ap['area_ha']=(ap.to_crs(UTM).area/1e4).round(1)
# agriculture Bolivia classified
ab=fix(gpd.read_file(BO,layer='classified_agriculture'))
ab=gpd.GeoDataFrame({'cls':ab['Cedula_1'].str.split(' ').str[0],'mix':ab['Cedula_1'],'municipality':ab['MUNICIPIO'],'department':ab['DEPARTAMEN'],'subbasin':ab['SUBCUENCA'],'soil':ab['USDA']},geometry=ab.geometry,crs=ab.crs)
ab['area_ha']=(ab.to_crs(UTM).area/1e4).round(1)
print('agri bo classes', ab.cls.value_counts().to_dict())
# TDPS total crop area
td=fix(gpd.read_file(SH,layer='tdps_total_crop_area')).explode(index_parts=False)
td=td[td.geom_type.isin(['Polygon','MultiPolygon'])]
tdu=td.to_crs(UTM); td['area_ha']=(tdu.area/1e4)
print('tdps parts',len(td),'total ha',round(td.area_ha.sum()), 'parts<1ha', int((td.area_ha<1).sum()))
for n,g in dict(basin=basin,mun=mun,roads=rd,places=pl,agri_pe=ap,agri_bo=ab,tdps=td).items():
    g.to_file(STAGE, layer=n, driver="GPKG")

# ================================================================ 2. vetores compactos
import geopandas as gpd, json, os, math
from shapely.geometry import Polygon, MultiPolygon
S=STAGE; OUT='data'; DL='data/download'; os.makedirs(DL,exist_ok=True)
Q=1e5
def clean_poly(geom, min_ha, crs_factor):
    # drop small parts and holes (area in deg² approximated with factor m²/deg² at ~16°S)
    polys=list(geom.geoms) if geom.geom_type=='MultiPolygon' else [geom]
    out=[]
    for p in polys:
        if p.area*crs_factor/1e4 < min_ha: continue
        holes=[h for h in p.interiors if Polygon(h).area*crs_factor/1e4 >= min_ha]
        out.append(Polygon(p.exterior, holes))
    if not out: return None
    return MultiPolygon(out) if len(out)>1 else out[0]
F=(111320*111320*math.cos(math.radians(16.5)))
def enc_line(coords):
    res=[]; px=py=0
    for x,y,*_ in coords:
        ix=int(round(x*Q)); iy=int(round(y*Q))
        if res and ix==px and iy==py: continue
        res += [ix-px, iy-py]; px,py=ix,iy
    return res
def enc(g):
    t=g.geom_type
    if t=='Point': return ['P',[int(round(g.x*Q)),int(round(g.y*Q))]]
    if t=='LineString': return ['L',[enc_line(g.coords)]]
    if t=='MultiLineString': return ['L',[enc_line(l.coords) for l in g.geoms]]
    if t=='Polygon': return ['A',[[enc_line(g.exterior.coords)]+[enc_line(i.coords) for i in g.interiors]]]
    if t=='MultiPolygon': return ['A',[[enc_line(p.exterior.coords)]+[enc_line(i.coords) for i in p.interiors] for p in g.geoms]]
    if t=='GeometryCollection':
        parts=[x for x in g.geoms if x.geom_type in ('Polygon','MultiPolygon','LineString','MultiLineString')]
        return enc(parts[0]) if len(parts)==1 else None
    return None
def val(v):
    if v is None: return None
    if isinstance(v,float) and math.isnan(v): return None
    return v.item() if hasattr(v,'item') else v
def export(key,g,tol,props,min_ha=0):
    g=g.copy()
    if min_ha: g['geometry']=[clean_poly(x,min_ha,F) for x in g.geometry]; g=g[g.geometry.notna()]
    if tol: g['geometry']=g.geometry.simplify(tol,preserve_topology=True)
    g=g[~g.geometry.is_empty]
    rows=[]; feats=[]
    for _,r in g.iterrows():
        e=enc(r.geometry)
        if e is None: continue
        pv=[val(r[k]) for k in props]
        rows.append(pv+[e])
        gi=r.geometry.__geo_interface__
        feats.append({'type':'Feature','properties':dict(zip(props,pv)),'geometry':json.loads(json.dumps(gi,default=list))})
    pack={'q':Q,'props':props,'rows':rows}
    s=json.dumps(pack,ensure_ascii=False,separators=(',',':'))
    open(f'{OUT}/{key}.js','w',encoding='utf-8').write('window.TRANSCEND_DATA=window.TRANSCEND_DATA||{};TRANSCEND_DATA["%s"]=%s;\n'%(key,s))
    gj=gpd.GeoDataFrame(g[props].copy(),geometry=g.geometry,crs=4326)
    gj.to_file(f'{DL}/{key}.geojson',driver='GeoJSON',COORDINATE_PRECISION=5)
    print(key,len(rows),'js %.2f MB'%(len(s)/1e6),'geojson %.2f MB'%(os.path.getsize(f'{DL}/{key}.geojson')/1e6))
b=gpd.read_file(S,layer='basin'); export('basin',b,0.0003,[])
m=gpd.read_file(S,layer='mun'); m['study']=m['study'].astype(int)
export('municipalities',m,0.0003,['name','country','admin1','admin2','code','area_km2','pct_basin','study'])
r=gpd.read_file(S,layer='roads'); export('roads',r,0.0001,['road_class','ref','name','surface'])
p=gpd.read_file(S,layer='places'); export('places',p,0,['name','place'])
a=gpd.read_file(S,layer='agri_pe'); export('agri_peru',a,0.0001,['province','district','area_ha'],min_ha=0.1)
a=gpd.read_file(S,layer='agri_bo'); export('agri_bolivia',a,0.0001,['cls','municipality','department','subbasin','soil','area_ha'],min_ha=0.1)

# ================================================================ 3. teselas raster
import numpy as np, rasterio, os, math, geopandas as gpd, time
from rasterio.warp import reproject, Resampling
from rasterio.features import rasterize
from rasterio.transform import Affine
from PIL import Image
Z=12; ORIG=20037508.342789244; RES=2*ORIG/(256*2**Z)
def lon2px(lon,z): return (lon+180)/360*256*2**z
def lat2py(lat,z):
    s=math.sin(math.radians(lat)); return (0.5-math.log((1+s)/(1-s))/(4*math.pi))*256*2**z
W,S,E,N=-71.13,-19.52,-66.34,-14.04
tx0=int(lon2px(W,Z)//256); tx1=int(lon2px(E,Z)//256); ty0=int(lat2py(N,Z)//256); ty1=int(lat2py(S,Z)//256)
cols=(tx1-tx0+1)*256; rows=(ty1-ty0+1)*256
tr=Affine(RES,0,-ORIG+tx0*256*RES,0,-RES,ORIG-ty0*256*RES)
print('grid',cols,rows,'tiles',tx1-tx0+1,ty1-ty0+1)
def build(name):
    t=time.time()
    if name=='cropland':
        src=rasterio.open(os.path.join(BASE,'shared','Cropland_2024_basin.tif'))
        dst=np.full((rows,cols),255,np.uint8)
        reproject(rasterio.band(src,1),dst,src_transform=src.transform,src_crs=src.crs,src_nodata=255,dst_transform=tr,dst_crs='EPSG:3857',dst_nodata=255,resampling=Resampling.nearest,num_threads=2)
        m=(dst==1)
    else:
        g=gpd.read_file(STAGE,layer='tdps').to_crs(3857)
        m=rasterize(((geom,1) for geom in g.geometry),out_shape=(rows,cols),transform=tr,fill=0,dtype=np.uint8).astype(bool)
    print(name,'raster',round(time.time()-t),'s, cover',m.mean())
    return m
COL={'cropland':(255,165,0),'tdps':(231,41,138)}
def write(name,m):
    out=f'tiles/{name}'; n=0; size=0
    cov=m.astype(np.float32)
    ox,oy=tx0,ty0
    for z in range(Z,4,-1):
        h,w=cov.shape
        for j in range(h//256):
            for i in range(w//256):
                blk=cov[j*256:(j+1)*256,i*256:(i+1)*256]
                if blk.max()<=0: continue
                a=np.clip(blk*(1 if z==Z else 2.0),0,1)*235 if z<Z else blk*235
                rgba=np.zeros((256,256,4),np.uint8); rgba[...,0],rgba[...,1],rgba[...,2]=COL[name]; rgba[...,3]=a.astype(np.uint8)
                d=f'{out}/{z}/{ox+i}'; os.makedirs(d,exist_ok=True); fn=f'{d}/{oy+j}.png'
                Image.fromarray(rgba,'RGBA').save(fn,optimize=True); n+=1; size+=os.path.getsize(fn)
        # next level: pad to even tile count aligned to parent tiles
        px0,py0=ox%2,oy%2
        cov=np.pad(cov,((py0*256,0),(px0*256,0)))
        h,w=cov.shape; ph=(-h)%512; pw=(-w)%512
        cov=np.pad(cov,((0,ph),(0,pw)))
        cov=cov.reshape(cov.shape[0]//2,2,cov.shape[1]//2,2).mean(axis=(1,3))
        ox=(ox-px0)//2; oy=(oy-py0)//2
    print(name,'tiles',n,'%.1f MB'%(size/1e6))
for nm in ['cropland','tdps']:
    m=build(nm); write(nm,m); del m

# ================================================================ 4. meta.js (resumo do painel Explorar)
import geopandas as gpd, json
basin=gpd.read_file(STAGE,layer='basin'); b=basin.to_crs(32719); r=gpd.read_file(STAGE,layer='roads')
rin=r.clip(basin).to_crs(32719); rin['len']=rin.length/1000
km=rin.groupby('road_class')['len'].sum(); m=gpd.read_file(STAGE,layer='mun')
meta={'basin_km2':round(b.area.iloc[0]/1e6),'roads_km':{k:round(v) for k,v in km.items()},
 'mun':{c:int(n) for c,n in m.groupby('country').size().items()},'places':int(len(gpd.read_file(STAGE,layer='places'))),
 'bounds':[round(float(x),4) for x in basin.total_bounds]}
open('data/meta.js','w').write('window.TRANSCEND_META=%s;\n'%json.dumps(meta))
print(meta)
