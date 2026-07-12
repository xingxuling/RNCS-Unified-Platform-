import path from 'node:path';
import {clone,hash,GatewayError} from './canonical.mjs';
import {parseVersion} from './semver.mjs';
const uniq=xs=>[...new Set((xs??[]).map(String))].sort();
export function normalizeManifest(raw,file){
  const m={format:'reality-one.runtime-manifest.v0.3',runtime_id:String(raw.runtime_id??''),runtime_version:String(raw.runtime_version??''),display_name:String(raw.display_name??raw.runtime_id??''),gateway_protocol_versions:uniq(raw.gateway_protocol_versions??['0.3.0']),transport:clone(raw.transport??{}),bridge:String(raw.bridge??''),actions:uniq(raw.actions),protocols:uniq(raw.protocols),requires:clone(raw.requires??[]),priority:Number(raw.priority??0),health_timeout_ms:Number(raw.health_timeout_ms??2000),metadata:clone(raw.metadata??{}),manifest_file:path.resolve(file)};
  if(raw.format&&raw.format!==m.format)throw new GatewayError('MANIFEST_FORMAT_UNSUPPORTED',raw.format);
  if(!m.runtime_id)throw new GatewayError('MANIFEST_RUNTIME_ID_REQUIRED',file);parseVersion(m.runtime_version);
  if(!['node-module','stdio'].includes(m.transport.kind))throw new GatewayError('MANIFEST_TRANSPORT_UNSUPPORTED',m.transport.kind);
  if(m.transport.kind==='node-module'&&(!m.transport.package||!m.bridge))throw new GatewayError('MANIFEST_NODE_FIELDS_REQUIRED',file);
  if(!Number.isSafeInteger(m.health_timeout_ms)||m.health_timeout_ms<1)throw new GatewayError('MANIFEST_TIMEOUT_INVALID',file);
  const body=clone(m);delete body.manifest_file;m.manifest_root=hash(body);return m;
}
export function publicManifest(m){const o=clone(m);delete o.manifest_file;return o;}
