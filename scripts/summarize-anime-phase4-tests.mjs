import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index>=0?(args[index+1]??fallback):fallback};
const root=path.resolve(process.cwd());
const logFile=path.resolve(option('--log','tmp/anime-phase4-tests.log'));
const outFile=path.resolve(option('--out','evidence/anime-forge-phase4-v0.1/test-report.json'));
if(!logFile.startsWith(`${root}${path.sep}`)||!outFile.startsWith(`${root}${path.sep}`))throw new Error('ANIME_PHASE4_TEST_REPORT_PATH_ESCAPE');
const text=fs.readFileSync(logFile,'utf8'),lines=text.split(/\r?\n/),numbers=pattern=>lines.filter(line=>pattern.test(line)).map(line=>Number(line.match(/\d+/)?.[0]??0));
const nodeTests=numbers(/^ℹ tests /),nodePasses=numbers(/^ℹ pass /),nodeFails=numbers(/^ℹ fail /),nodeSkipped=numbers(/^ℹ skipped /),customPasses=lines.filter(line=>line.startsWith('PASS ')).length,customFailures=lines.filter(line=>line.startsWith('FAIL ')).length;
const sum=values=>values.reduce((total,value)=>total+value,0),nodeTotal=sum(nodeTests),nodePassed=sum(nodePasses),nodeFailed=sum(nodeFails),skipped=sum(nodeSkipped),total=nodeTotal+customPasses+customFailures,passed=nodePassed+customPasses,failed=nodeFailed+customFailures,status=failed===0&&skipped===0&&total===passed?'pass':'fail';
const report={format:'rncs.anime-phase4-test-report.v0.1',version:'0.1.0-alpha.1',status,command:'npm run test:anime-phase4',node:{blocks:nodeTests.length,tests:nodeTotal,passed:nodePassed,failed:nodeFailed,skipped},native:{passed:customPasses,failed:customFailures},total:{tests:total,passed,failed,skipped},coverage:['Anime Provider Manifest','Episode authority','Character Genome continuity','X-Sheet and Motion Track alignment','Cut seams','phoneme and viseme timeline','frame integrity','audio mix','FFmpeg missing and timeout negatives','real MP4 and ffprobe','Provider fallback','deterministic rebuild','Reality Studio API','RAGF','RSR','VSR'],log:{path:path.relative(root,logFile).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(text).digest('hex')},boundary:'local focused and package regression evidence; GitHub Actions and human media review remain separate gates'};
report.report_root=crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
fs.mkdirSync(path.dirname(outFile),{recursive:true});fs.writeFileSync(outFile,`${JSON.stringify(report,null,2)}\n`);
if(status!=='pass')throw Object.assign(new Error('ANIME_PHASE4_TEST_REPORT_FAILED'),{details:report.total});
process.stdout.write(`${JSON.stringify({ok:true,out:outFile,total:report.total,report_root:report.report_root},null,2)}\n`);
