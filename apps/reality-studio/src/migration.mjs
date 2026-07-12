import {createProject,sealProject,FORMAT} from './model.mjs';
import {clone,rootHash,StudioError} from './canonical.mjs';
export function migrateProject(input){
 if(input?.format===FORMAT)return sealProject(input);
 if(input?.format!=='reality-studio.project.v0.5')throw new StudioError('MIGRATION_FORMAT_UNSUPPORTED',input?.format??'unknown');
 const owner='subject:studio-owner',p=createProject({title:input.title??'迁移项目',owner});
 p.identity.project_id=`project:migrated:${String(input.projectUid??input.projectId??rootHash(input).slice(0,12))}`;p.identity.description=input.description??'由Reality Studio v0.5迁移';
 p.artifact.artifact_id=`artifact:experience:${String(input.projectUid??rootHash(input).slice(0,12))}`;p.artifact.title=input.title??'二维体验';p.artifact.kind='interactive-experience';p.artifact.values={status:'prototype',progress:50,summary:input.description??'',approved:false,scene_count:(input.scenes??[]).length,object_count:(input.scenes??[]).reduce((n,s)=>n+(s.objects?.length??0),0)};
 p.artifact.field_schema.scene_count={type:'number',label:'场景数',editable:false};p.artifact.field_schema.object_count={type:'number',label:'对象数',editable:false};
 p.reality.facts=[{fact_id:'fact:legacy-scene-count',subject:p.artifact.artifact_id,predicate:'experience.scene_count',value:p.artifact.values.scene_count,source:'studio-v0.5-migration'},{fact_id:'fact:legacy-object-count',subject:p.artifact.artifact_id,predicate:'experience.object_count',value:p.artifact.values.object_count,source:'studio-v0.5-migration'}];
 p.projections.push({projection_id:'projection:experience-canvas',title:'二维体验画布',observer_id:owner,modality:'visual',target_host:'browser-canvas',visible_fields:['legacy_project'],actions:[]});
 p.experience={kind:'projection-module',legacy_format:'reality-studio.project.v0.5',legacy_project:clone(input),migration:{source_version:input.version??'0.5.x',source_root:rootHash(input),migrated_at:new Date().toISOString()}};
 p.metadata.revision=1;p.metadata.migrated_from='reality-studio.project.v0.5';return sealProject(p)
}
