import {clone,rootHash,seal,BuildError} from './canonical.mjs';
import {validateUITree,validateInputProfile,layoutUITree,compileUIInputManifest} from '@taowind/reality-studio-native';

export const BUILD_UI_INPUT_FORMAT='reality-build.ui-input-runtime.v0.1';
export const BUILD_UI_INPUT_VERSION='0.1.0-alpha.1';

function activeTree(project){
  const id=project?.ui?.active_ui_id;
  return id?project.ui.trees?.[id]:null;
}

function activeProfile(project){
  const id=project?.input?.active_profile_id;
  return id?project.input.profiles?.[id]:null;
}

export function validateBuildUIInput(project){
  const errors=[],warnings=[];
  const hasUi=project?.ui!==undefined,hasInput=project?.input!==undefined;
  if(!hasUi&&!hasInput)return{configured:false,valid:true,errors,warnings,tree_count:0,profile_count:0};
  if(!hasUi)errors.push({code:'UI_TREE_SECTION_REQUIRED',path:'ui'});
  if(!hasInput)errors.push({code:'INPUT_PROFILE_SECTION_REQUIRED',path:'input'});
  const trees=project?.ui?.trees??{},profiles=project?.input?.profiles??{};
  for(const [id,tree] of Object.entries(trees)){const result=validateUITree(tree);if(!result.valid)errors.push({code:'UI_TREE_INVALID',path:`ui.trees.${id}`,details:result});warnings.push(...result.warnings.map(w=>({...w,ui_id:id})))}
  for(const [id,profile] of Object.entries(profiles)){const result=validateInputProfile(profile);if(!result.valid)errors.push({code:'INPUT_PROFILE_INVALID',path:`input.profiles.${id}`,details:result});warnings.push(...result.warnings.map(w=>({...w,profile_id:id})))}
  if(hasUi&&!activeTree(project))errors.push({code:'ACTIVE_UI_MISSING',path:'ui.active_ui_id'});
  if(hasInput&&!activeProfile(project))errors.push({code:'ACTIVE_INPUT_PROFILE_MISSING',path:'input.active_profile_id'});
  return{configured:true,valid:errors.length===0,errors,warnings,tree_count:Object.keys(trees).length,profile_count:Object.keys(profiles).length};
}

export function createBuildUIInputRuntime(project,{touch=true}={}){
  const validation=validateBuildUIInput(project);
  if(!validation.valid)throw new BuildError('UI_INPUT_INVALID','',validation);
  if(!validation.configured)return null;
  const tree=activeTree(project),profile=activeProfile(project),scene=project.scenes?.find(s=>s.scene_id===project.active_scene_id)??project.scenes?.[0];
  const width=Number(scene?.canvas?.width??tree.design_size?.width??640),height=Number(scene?.canvas?.height??tree.design_size?.height??360);
  const layout=layoutUITree(tree,{width,height,data:{project:{title:project.identity?.title??''},globals:{paused:true},entities:{},device:{touch:Boolean(touch),kind:touch?'touch':'desktop'}}});
  const manifest=compileUIInputManifest({projectRoot:project.project_root,tree,profile,layout});
  return seal({format:BUILD_UI_INPUT_FORMAT,version:BUILD_UI_INPUT_VERSION,project_root:project.project_root,viewport:{width,height},ui_tree:clone(tree),input_profile:clone(profile),layout,manifest,ui_root:tree.ui_root,input_root:profile.input_root,manifest_root:manifest.manifest_root,lowering_root:rootHash({project_root:project.project_root,ui_root:tree.ui_root,input_root:profile.input_root,layout_root:layout.layout_root,manifest_root:manifest.manifest_root})},'runtime_root');
}
