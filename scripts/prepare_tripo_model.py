"""Blender background import: preserve a genuine Tripo OBJ's vertex colours and reduce for web."""
import bpy,sys,json
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]
source=Path(args[0]).resolve();output=Path(args[1]).resolve();target=int(args[2]) if len(args)>2 else 30000
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=str(source))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
source_faces=sum(len(o.data.polygons) for o in meshes)
source_vertices=sum(len(o.data.vertices) for o in meshes)
for obj in meshes:
 bpy.context.view_layer.objects.active=obj;obj.select_set(True)
 print('Imported',obj.name,'colours',[(c.name,c.domain) for c in obj.data.color_attributes])
 # Blender's OBJ importer recognizes Tripo's XYZRGB vertex records.
 if len(obj.data.color_attributes):
  attr=obj.data.color_attributes[0]
  obj.data.color_attributes.active_color=attr
  mat=bpy.data.materials.new('Tripo original vertex colours');mat.use_nodes=True
  nodes=mat.node_tree.nodes;shader=nodes.get('Principled BSDF');colour=nodes.new('ShaderNodeVertexColor');colour.layer_name=attr.name
  mat.node_tree.links.new(colour.outputs['Color'],shader.inputs['Base Color']);shader.inputs['Roughness'].default_value=.72
  obj.data.materials.clear();obj.data.materials.append(mat)
 dec=obj.modifiers.new('Web polygon budget','DECIMATE');dec.ratio=min(1,target/source_faces);dec.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=dec.name)
 for face in obj.data.polygons:face.use_smooth=True
 obj.name='tripo-night-owl'
 obj.select_set(False)
# Keep native geometry orientation; glTF exporter performs the Z-up to Y-up conversion.
bpy.ops.object.select_all(action='SELECT')
output.parent.mkdir(exist_ok=True,parents=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_materials='EXPORT',export_yup=True,export_apply=True)
report={'source_faces':source_faces,'source_vertices':source_vertices,'target_faces':target,'result_faces':sum(len(o.data.polygons) for o in meshes),'result_vertices':sum(len(o.data.vertices) for o in meshes),'bytes':output.stat().st_size,'objects':[{ 'name':o.name,'dimensions':list(o.dimensions),'colours':[(c.name,c.domain) for c in o.data.color_attributes]} for o in meshes]}
output.with_suffix('.report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
