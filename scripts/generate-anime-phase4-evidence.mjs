import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {buildAnimeEpisodeMedia,compareAnimeEpisodeBuilds} from '../packages/integration/rcl-anime-production-bridge/src/index.mjs';

const root=path.resolve(process.cwd());
const sourceFile=path.join(root,'packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-micro-episode.rcl');
const target=path.join(root,'evidence/anime-forge-phase4-v0.1');
const buildA=path.join(root,'tmp/anime-forge-phase4-evidence-a');
const buildB=path.join(root,'tmp/anime-forge-phase4-evidence-b');
const ffmpegPath=process.env.FFMPEG_PATH??'ffmpeg';
const ffprobePath=process.env.FFPROBE_PATH??'ffprobe';
const preservedNames=['test-report.json','studio-browser-evidence.json','studio-anime-forge-desktop.png','studio-anime-forge-mobile.png'];
const preserved=new Map(preservedNames.filter(name=>fs.existsSync(path.join(target,name))).map(name=>[name,fs.readFileSync(path.join(target,name))]));
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const writeJson=(relative,value)=>{const file=path.join(target,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`)};
const copy=(from,relative)=>{const to=path.join(target,relative);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to)};
const seal=(value,field)=>({...value,[field]:sha256(Buffer.from(JSON.stringify(value)))});

for(const directory of [target,buildA,buildB]){if(directory===root||!directory.startsWith(`${root}${path.sep}`))throw new Error(`ANIME_PHASE4_EVIDENCE_PATH_ESCAPE:${directory}`);fs.rmSync(directory,{recursive:true,force:true});fs.mkdirSync(directory,{recursive:true})}
for(const [name,bytes] of preserved)fs.writeFileSync(path.join(target,name),bytes);

const common={sourceFile,quality:'preview',ffmpegPath,ffprobePath,requireMp4:true,createdAt:'2026-08-06T00:00:00.000Z'};
const first=buildAnimeEpisodeMedia({...common,outDir:buildA});
const second=buildAnimeEpisodeMedia({...common,outDir:buildB});
const comparison=compareAnimeEpisodeBuilds(first,second);
const firstMp4=fs.readFileSync(path.join(buildA,'episode.mp4'));
const secondMp4=fs.readFileSync(path.join(buildB,'episode.mp4'));
const firstWav=fs.readFileSync(path.join(buildA,'episode.wav'));
const secondWav=fs.readFileSync(path.join(buildB,'episode.wav'));
const frameManifest=first.rendered.manifest;
const stateRoots=new Set(frameManifest.frames.map(frame=>frame.state_root));
const renderOutputRoots=new Set(frameManifest.frames.map(frame=>frame.render_output_root));
const pngHashes=frameManifest.frames.map(frame=>sha256(fs.readFileSync(path.join(buildA,'render',frame.filename))));
const uniquePngHashes=new Set(pngHashes);
const cutVariation=Object.fromEntries([...new Set(frameManifest.frames.map(frame=>frame.cut_ref))].map(cutRef=>{const indices=frameManifest.frames.map((frame,index)=>frame.cut_ref===cutRef?index:-1).filter(index=>index>=0);return[cutRef,{frame_count:indices.length,unique_state_roots:new Set(indices.map(index=>frameManifest.frames[index].state_root)).size,unique_png_sha256:new Set(indices.map(index=>pngHashes[index])).size}]}));
const ffmpegProvider=first.provider_set.manifests.find(item=>item.provider_id==='rncs.video-mux.ffmpeg');
const requiredChecks={
  build_a_complete:first.ok,
  build_b_complete:second.ok,
  all_media_gates:Object.values(first.ledger.gates).every(Boolean)&&Object.values(second.ledger.gates).every(Boolean),
  deterministic_roots_match:comparison.status==='pass',
  real_mp4:firstMp4.subarray(4,8).toString('ascii')==='ftyp'&&secondMp4.subarray(4,8).toString('ascii')==='ftyp',
  ffprobe_valid:first.mux.probe_report?.validation?.valid===true&&second.mux.probe_report?.validation?.valid===true,
  three_cuts:first.summary.cut_count===3,
  twenty_seconds:first.summary.duration_seconds===20,
  frame_count:first.summary.frame_count===480,
  frame_variation:stateRoots.size===frameManifest.expected_frame_count&&renderOutputRoots.size===frameManifest.expected_frame_count&&uniquePngHashes.size>=Math.ceil(frameManifest.expected_frame_count*.5)&&Object.keys(cutVariation).length===3&&Object.values(cutVariation).every(item=>item.unique_png_sha256>1),
  character_continuity:first.character_continuity.status==='pass',
  cut_continuity:first.cut_continuity.status==='pass',
  audio_video_sync:first.sync.status==='pass',
  ffmpeg_version_scoped:ffmpegProvider?.determinism?.deterministic===false,
};
if(!Object.values(requiredChecks).every(Boolean))throw Object.assign(new Error('ANIME_PHASE4_EVIDENCE_GATE_FAILED'),{details:requiredChecks});

const filesToCopy=[
  ['source.anime.rcl','source.anime.rcl'],['production.ir.json','production.ir.json'],['episode.mp4','episode.mp4'],['episode.wav','episode.wav'],
  ['anime-provider-manifest.json','anime-provider-manifest.json'],['asset-lineage.json','asset-lineage.json'],['character-continuity-report.json','character-continuity-report.json'],
  ['cut-continuity-report.json','cut-continuity-report.json'],['frame-integrity-report.json','frame-integrity-report.json'],['audio-video-sync-report.json','audio-video-sync-report.json'],
  ['ffprobe-report.json','ffprobe-report.json'],['video-mux-report.json','video-mux-report.json'],['replay-report.json','replay-report.json'],['reproducible-build.json','reproducible-build.json'],
  ['evidence-ledger.json','evidence-ledger.json'],['build-summary.json','build-summary.json'],['SHA256SUMS.json','build-SHA256SUMS.json'],['SHA256SUMS.txt','build-SHA256SUMS.txt'],
  ['render/frames-manifest.json','frame-manifest.json'],['render/xsheets.json','xsheets.json'],['render/editorial-timeline.json','editorial-timeline.json'],['render/audio/audio-report.json','audio-mix-report.json'],
];
for(const [from,to] of filesToCopy)copy(path.join(buildA,from),to);
fs.cpSync(path.join(buildA,'assets'),path.join(target,'assets'),{recursive:true});
for(const cutName of fs.readdirSync(path.join(buildA,'voices')))for(const dialogueName of fs.readdirSync(path.join(buildA,'voices',cutName)))for(const name of ['bundle.json','viseme_timeline.json','phoneme_timeline.json','waveform_summary.json'])copy(path.join(buildA,'voices',cutName,dialogueName,name),path.join('voices',cutName,dialogueName,name));
for(const frameIndex of [96,250,390]){const frame=frameManifest.frames[frameIndex],cutId=frame.cut_ref.split('/').at(-1);copy(path.join(buildA,'render',frame.filename),path.join('representative-frames',`frame-${String(frameIndex).padStart(6,'0')}-${cutId}.png`))}
writeJson('deterministic-build-comparison.json',{...comparison,local_tool_scoped_bytes:{mp4_equal:firstMp4.equals(secondMp4),mp4_sha256_a:sha256(firstMp4),mp4_sha256_b:sha256(secondMp4),wav_equal:firstWav.equals(secondWav),wav_sha256_a:sha256(firstWav),wav_sha256_b:sha256(secondWav)}});

const summary=seal({
  format:'rncs.anime-forge-phase4-evidence-summary.v0.1',version:'0.1.0-alpha.1',date:'2026-08-06',status:'complete',authority:'RNCS',
  baseline:'origin/main-95@ef81e8fa311a029db5540c5af90ab1f4a283a141',source:'packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-micro-episode.rcl',
  programme:{duration_seconds:first.summary.duration_seconds,fps:first.summary.fps,width:first.summary.width,height:first.summary.height,frame_count:first.summary.frame_count,unique_state_roots:stateRoots.size,unique_render_output_roots:renderOutputRoots.size,unique_png_sha256:uniquePngHashes.size,png_variation_ratio:uniquePngHashes.size/frameManifest.expected_frame_count,cut_count:first.summary.cut_count,dialogue_count:first.summary.dialogue_count,cut_variation:cutVariation},
  providers:first.summary.providers,roots:{...first.summary.deterministic_roots,asset_lineage_root:first.ledger.roots.asset_lineage_root,provider_manifest_set_root:first.ledger.roots.provider_manifest_set_root,evidence_ledger_root:first.ledger.ledger_root,deterministic_comparison_root:comparison.comparison_root},
  media:{mp4_path:'episode.mp4',mp4_sha256:sha256(firstMp4),mp4_bytes:firstMp4.length,wav_path:'episode.wav',wav_sha256:sha256(firstWav),wav_bytes:firstWav.length,codec:first.mux.probe_report.probe.video.codec,audio_codec:first.mux.probe_report.probe.audio.codec,ffmpeg_version:first.mux.report.tools.ffmpeg.version,ffprobe_version:first.mux.report.tools.ffprobe.version},
  checks:requiredChecks,gates:first.ledger.gates,
  evidence_files:filesToCopy.map(([,to])=>to).concat(['deterministic-build-comparison.json','test-report.json','studio-browser-evidence.json','studio-anime-forge-desktop.png','studio-anime-forge-mobile.png']).filter(relative=>fs.existsSync(path.join(target,relative))),
  boundaries:{editorial_kernel:'implemented',media_pipeline:'implemented with real local FFmpeg and ffprobe',provider:'real built-in deterministic RAGF/VSR/RSR/Voice/Audio paths plus real FFmpeg mux',assets:'experimental built-in Anime quality',commercial_quality:'not proven',voice:'synthetic reference performance, not licensed actor performance',motion:'bounded procedural secondary motion, not physical simulation',acceptance:'clean-machine, broadcaster and human art-direction acceptance remain open'},
},'evidence_root');
writeJson('evidence-summary.json',summary);

const inventoryFiles=[];
const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(!entry.name.startsWith('evidence-SHA256SUMS')){const bytes=fs.readFileSync(file);inventoryFiles.push({path:path.relative(target,file).replaceAll('\\','/'),bytes:bytes.length,sha256:sha256(bytes)})}}};
walk(target);
const inventory=seal({format:'rncs.anime-phase4-evidence-sha256.v0.1',files:inventoryFiles},'inventory_root');
writeJson('evidence-SHA256SUMS.json',inventory);
fs.writeFileSync(path.join(target,'evidence-SHA256SUMS.txt'),`${inventory.files.map(item=>`${item.sha256}  ${item.path}`).join('\n')}\n`);

const textFiles=inventory.files.filter(item=>/\.(json|txt|rcl)$/i.test(item.path));
const absolutePathHits=[];
for(const item of textFiles){const text=fs.readFileSync(path.join(target,item.path),'utf8');if(/[A-Za-z]:\\+Users\\+|\/home\/runner\/work\//.test(text))absolutePathHits.push(item.path)}
if(absolutePathHits.length)throw Object.assign(new Error('ANIME_PHASE4_ABSOLUTE_PATH_LEAK'),{details:absolutePathHits});

process.stdout.write(`${JSON.stringify({ok:true,target,programme:summary.programme,mp4:summary.media.mp4_path,mp4_sha256:summary.media.mp4_sha256,wav_sha256:summary.media.wav_sha256,evidence_ledger_root:summary.roots.evidence_ledger_root,evidence_root:summary.evidence_root,inventory_root:inventory.inventory_root,comparison_status:comparison.status,checks:requiredChecks},null,2)}\n`);
