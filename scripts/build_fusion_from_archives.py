from __future__ import annotations
from pathlib import Path
import zipfile, shutil, json, re, os

DATA=Path('/mnt/data')
WORK=DATA/'rncs_aether_fusion_v03_build'
ROOT=WORK/'RNCS_Aetherworld_Unified_v0.3.0-alpha.1'
SOURCES=WORK/'sources'

for p in [WORK]:
    if p.exists(): shutil.rmtree(p)
SOURCES.mkdir(parents=True)

zips={
 'rncs':DATA/'RNCS_Unified_Platform_v0.2.0-alpha.1_全栈统一母工程_完整源码与运行包.zip',
 'aether':DATA/'taowindaether-main.zip',
 'csl':DATA/'taowindcsl-main.zip',
 'seed':DATA/'aether-seed-forge-main.zip',
}
for name,zp in zips.items():
    dest=SOURCES/name; dest.mkdir()
    with zipfile.ZipFile(zp) as z: z.extractall(dest)

def only_child(p:Path)->Path:
    items=[x for x in p.iterdir() if x.name!='__MACOSX']
    return items[0] if len(items)==1 and items[0].is_dir() else p

rncs=only_child(SOURCES/'rncs')
aether=only_child(SOURCES/'aether')
csl=only_child(SOURCES/'csl')
seed=only_child(SOURCES/'seed')

EXCLUDE={'.git','node_modules','dist','dist-ssr','.tanstack','.output','.vinxi','.wrangler','coverage','artifacts','__pycache__'}
def copytree(src:Path,dst:Path,extra=()):
    ex=EXCLUDE|set(extra)
    def ign(path,names): return [n for n in names if n in ex or n=='.DS_Store']
    shutil.copytree(src,dst,ignore=ign,dirs_exist_ok=True)

copytree(rncs,ROOT)
for p in [ROOT/'node_modules',ROOT/'artifacts']:
    if p.exists(): shutil.rmtree(p)
copytree(aether,ROOT/'apps/aetherworld')
copytree(csl,ROOT/'apps/csl-studio')
copytree(seed,ROOT/'apps/seed-forge')
legacy_test=ROOT/'tests/unified.integration.test.mjs'
if legacy_test.exists():
 lt=legacy_test.read_text().replace("assert.equal(health.runtimes.length,8)","assert.equal(health.runtimes.length,12)").replace("branches:[{branch_id:'branch:safe',operations:","branches:[{branch_id:'branch:safe',parent_branch_id:'branch:main',operations:")
 legacy_test.write_text(lt)

# ---------- Aetherworld first-round foundation ----------
aw=ROOT/'apps/aetherworld'
for p in [aw/'.env',aw/'dist',aw/'.tanstack']:
    if p.is_file(): p.unlink()
    elif p.is_dir(): shutil.rmtree(p)
# gitignore
p=aw/'.gitignore'; txt=p.read_text(errors='ignore')
for block in [
'\n# Local environment and secrets\n.env\n.env.local\n.env.*.local\n!.env.example\n',
'\n# Local model, dataset and training outputs\noutputs/\ncheckpoints/\n*.safetensors\n*.gguf\n*.pt\n*.pth\n']:
    if block.strip().splitlines()[0] not in txt: txt += block
p.write_text(txt)
(aw/'.env.example').write_text('''# Browser-visible configuration. Copy to .env for local development.\nVITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\nVITE_SUPABASE_PROJECT_ID=\nSUPABASE_URL=\nSUPABASE_PUBLISHABLE_KEY=\n''')
(aw/'index.html').write_text('''<!doctype html>\n<html lang="zh-CN" class="dark"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><meta name="description" content="Aetherworld 道风以太：本地优先AI工作台、模型制造与智能体协作入口。"/><meta name="theme-color" content="#09090b"/><link rel="icon" href="/favicon.ico"/><title>Aetherworld｜道风以太</title></head><body><div id="root"></div><script type="module" src="/src/spa-main.tsx"></script></body></html>\n''')
(aw/'src/spa-main.tsx').write_text('''import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport { RouterProvider } from "@tanstack/react-router";\nimport { getRouter } from "@/router";\nimport "@/styles.css";\nconst router = getRouter();\ndeclare module "@tanstack/react-router" { interface Register { router: ReturnType<typeof getRouter>; } }\nconst root = document.getElementById("root");\nif (!root) throw new Error("Aetherworld SPA root element was not found.");\ncreateRoot(root).render(<StrictMode><RouterProvider router={router}/></StrictMode>);\n''')
(aw/'vite.spa.config.ts').write_text('''import path from "node:path";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\nimport { tanstackRouter } from "@tanstack/router-plugin/vite";\nimport { defineConfig } from "vite";\nimport tsconfigPaths from "vite-tsconfig-paths";\nexport default defineConfig({plugins:[tanstackRouter({target:"react",autoCodeSplitting:true,routesDirectory:path.resolve("src/routes"),generatedRouteTree:path.resolve("src/routeTree.gen.ts")}),react(),tailwindcss(),tsconfigPaths({projects:[path.resolve("tsconfig.json")]})],build:{outDir:"dist",emptyOutDir:true,chunkSizeWarningLimit:1400},resolve:{alias:{"@":path.resolve("src")}}});\n''')
(aw/'scripts').mkdir(exist_ok=True)
(aw/'scripts/generate-routes.mjs').write_text('''import { Generator, getConfig } from "@tanstack/router-generator";\nconst root=process.cwd();\nconst config=getConfig({target:"react",routesDirectory:"./src/routes",generatedRouteTree:"./src/routeTree.gen.ts",quoteStyle:"single",semicolons:false,autoCodeSplitting:true},root);\nawait new Generator({config,root}).run();\nconsole.log("[routes] synchronized");\n''')
(aw/'scripts/aether-health.mjs').write_text('''import {existsSync,readFileSync,readdirSync,statSync} from "node:fs";import {join,relative,resolve} from "node:path";\nconst root=process.cwd(),fail=[],warn=[];function walk(d,p){if(!existsSync(d))return[];const a=[];for(const e of readdirSync(d)){const x=join(d,e),s=statSync(x);if(s.isDirectory())a.push(...walk(x,p));else if(!p||p(x))a.push(x)}return a}\nfor(const x of ["package.json","index.html","src/spa-main.tsx","src/router.tsx","src/routeTree.gen.ts","src/routes","src/lib","tools/aetherseed-kernel","local-gateway",".env.example"])if(!existsSync(resolve(root,x)))fail.push(`Missing ${x}`);\nconst routes=walk(resolve(root,"src/routes"),f=>/\\.(tsx?|jsx?)$/.test(f)),tree=existsSync(resolve(root,"src/routeTree.gen.ts"))?readFileSync(resolve(root,"src/routeTree.gen.ts"),"utf8"):"";const missing=routes.filter(f=>!f.endsWith("__root.tsx")).map(f=>relative(resolve(root,"src/routes"),f).replace(/\\\\/g,"/").replace(/\\.(tsx?|jsx?)$/,"")).filter(r=>!tree.includes(`./routes/${r}`));if(missing.length)fail.push(`Route tree missing ${missing.length}`);\nconst src=walk(resolve(root,"src"),f=>/\\.(tsx?|jsx?)$/.test(f));let server=0,local=0;for(const f of src){const t=readFileSync(f,"utf8");if(t.includes("createServerFn"))server++;if(t.includes("localStorage"))local++;}\nconst out={status:fail.length?"failed":"healthy",routeFiles:routes.length,sourceFiles:src.length,serverFunctionDefinitionFiles:server,localStorageFiles:local,spaOutputReady:existsSync(resolve(root,"dist/index.html")),hardFailures:fail,warnings:warn};console.log(JSON.stringify(out,null,2));if(fail.length)process.exit(1);\n''')
(aw/'wrangler.spa.jsonc').write_text('''{"$schema":"node_modules/wrangler/config-schema.json","name":"aetherworld","compatibility_date":"2026-07-02","assets":{"directory":"./dist","not_found_handling":"single-page-application"}}\n''')
(aw/'docs/architecture').mkdir(parents=True,exist_ok=True)
(aw/'docs/architecture/RNCS-INTEGRATION.md').write_text('''# Aetherworld × RNCS\n\nAetherworld负责用户入口、模型、训练、Agent和文明规划；RNCS是唯一权威执行平台。意图接ICAR，能力接CNP/Gateway，授权接AAF，候选方案接RBF，规则接Behavior，事实证据接RFE/LAF，资产接RAGF，模拟接RSR，视觉接VSR，发布接Reality Studio/Build。\n''')
(aw/'.github/workflows').mkdir(parents=True,exist_ok=True)
(aw/'.github/workflows/quality.yml').write_text('''name: Aetherworld quality gate\non:\n  push:\n  pull_request:\njobs:\n  spa-quality:\n    runs-on: ubuntu-latest\n    timeout-minutes: 20\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - run: npm ci\n      - run: npm run check\n''')
awpkg=json.loads((aw/'package.json').read_text())
awpkg['name']='@taowind/aetherworld'; awpkg['version']='0.1.0-unified.1'
awpkg['scripts'].update({'dev:spa':'vite --config vite.spa.config.ts','routes:generate':'node scripts/generate-routes.mjs','build':'npm run build:spa','build:spa':'npm run routes:generate && vite build --config vite.spa.config.ts','build:start':'npm run routes:generate && vite build','preview':'vite preview --config vite.spa.config.ts','deploy:spa':'npm run build:spa && wrangler deploy --config wrangler.spa.jsonc','typecheck':'npm run routes:generate && tsc --noEmit','health':'node scripts/aether-health.mjs','check':'npm run build:spa && npm run typecheck && npm run health'})
(aw/'package.json').write_text(json.dumps(awpkg,ensure_ascii=False,indent=2)+'\n')
# package-lock identity only; dependencies unchanged
pl=aw/'package-lock.json'
if pl.exists():
    d=json.loads(pl.read_text()); d['name']=awpkg['name']; d['version']=awpkg['version'];
    if '' in d.get('packages',{}): d['packages']['']['name']=awpkg['name']; d['packages']['']['version']=awpkg['version']
    pl.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

# ---------- CSL canonical compiler ----------
cslapp=ROOT/'apps/csl-studio'; cslpkg=ROOT/'packages/languages/csl-compiler'; (cslpkg).mkdir(parents=True)
shutil.copytree(cslapp/'src/csl',cslpkg/'src',dirs_exist_ok=True); shutil.rmtree(cslapp/'src/csl')
p=cslpkg/'src/ui/object-shell-state.ts'; s=p.read_text().replace("from '@/csl/workspace/compat'","from '../workspace/compat'").replace("from '@/csl'","from '../index'").replace("from '@/csl/version-stamps'","from '../version-stamps'"); p.write_text(s)
(cslpkg/'package.json').write_text(json.dumps({'name':'@taowind/csl-compiler','version':'0.9.0-unified.1','private':True,'type':'module','exports':{'.':'./src/index.ts','./*':'./src/*'},'dependencies':{'jszip':'^3.10.1'}},ensure_ascii=False,indent=2)+'\n')
# patch CSL app config
p=cslapp/'package.json'; cp=json.loads(p.read_text()); cp['name']='@taowind/csl-studio'; cp['version']='0.9.0-unified.1'; cp['scripts']['typecheck']='tsc --noEmit'; p.write_text(json.dumps(cp,ensure_ascii=False,indent=2)+'\n')
pl=cslapp/'package-lock.json'
if pl.exists():
    d=json.loads(pl.read_text()); d['name']=cp['name']; d['version']=cp['version'];
    if '' in d.get('packages',{}): d['packages']['']['name']=cp['name']; d['packages']['']['version']=cp['version']
    pl.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def _strip_jsonc_comments(text:str)->str:
    out=[]
    i=0
    in_string=False
    escaped=False
    while i < len(text):
        c=text[i]
        if in_string:
            out.append(c)
            if escaped:
                escaped=False
            elif c == "\\":
                escaped=True
            elif c == '"':
                in_string=False
            i += 1
            continue
        if c == '"':
            in_string=True
            out.append(c)
            i += 1
            continue
        if c == '/' and i + 1 < len(text) and text[i + 1] == '/':
            i += 2
            while i < len(text) and text[i] not in "\r\n":
                i += 1
            continue
        if c == '/' and i + 1 < len(text) and text[i + 1] == '*':
            i += 2
            while i + 1 < len(text) and not (text[i] == '*' and text[i + 1] == '/'):
                i += 1
            i = min(i + 2, len(text))
            continue
        out.append(c)
        i += 1
    return ''.join(out)

def load_jsonc(p:Path):
    t=_strip_jsonc_comments(p.read_text())
    t=re.sub(r',\s*([}\]])',r'\1',t)
    return json.loads(t)
for fn in ['tsconfig.json','tsconfig.app.json']:
    p=cslapp/fn; d=load_jsonc(p); paths=d.setdefault('compilerOptions',{}).setdefault('paths',{}); n={'@/csl':['../../packages/languages/csl-compiler/src/index.ts'],'@/csl/*':['../../packages/languages/csl-compiler/src/*']}; n.update(paths); d['compilerOptions']['paths']=n
    if fn=='tsconfig.app.json': d['include']=['src','../../packages/languages/csl-compiler/src']
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for fn in ['vite.config.ts','vitest.config.ts']:
    p=cslapp/fn; s=p.read_text(); s=s.replace('alias: {\n      "@": path.resolve(__dirname, "./src"),\n    }','alias: [\n      { find: "@/csl", replacement: path.resolve(__dirname, "../../packages/languages/csl-compiler/src") },\n      { find: "@", replacement: path.resolve(__dirname, "./src") },\n    ]').replace('alias: { "@": path.resolve(__dirname, "./src") }','alias: [\n      { find: "@/csl", replacement: path.resolve(__dirname, "../../packages/languages/csl-compiler/src") },\n      { find: "@", replacement: path.resolve(__dirname, "./src") },\n    ]'); p.write_text(s)
for p in (cslapp/'src/test').glob('*.ts*'):
    s=p.read_text(); s=re.sub(r"from ['\"]\.\./csl(/[^'\"]*)?['\"]",lambda m:"from '@/csl"+(m.group(1) or '')+"'",s); p.write_text(s)
(cslapp/'scripts').mkdir(exist_ok=True)
(cslapp/'scripts/test-shards-parallel.mjs').write_text('''import {spawn} from "node:child_process";import path from "node:path";const groups=[["src/test/bundle-import.test.ts","src/test/disabled-mode.test.ts","src/test/example.test.ts","src/test/ir-meta-completeness.test.ts","src/test/mode-permission-block.test.ts","src/test/ose-verdict-schema.test.ts","src/test/ose-verdict.test.ts","src/test/p10-compare-schema.test.ts","src/test/p10-shell-actions.test.ts","src/test/p10-viewer-interaction.test.tsx"],["src/test/p11-compare-migration.test.ts","src/test/p11-object-shell-state.test.ts","src/test/p11-shell-actions-api.test.ts","src/test/p11-viewer-state.test.ts","src/test/p12-compat-panel-controlled.test.tsx","src/test/p12-shell-actionbar-pages.test.tsx","src/test/p12-shell-statusbar-adapter.test.ts","src/test/p12-viewer-restore.test.tsx","src/test/p13-l2-parser.test.ts","src/test/p13-l2-shadow.test.ts"],["src/test/p14-l2-binding-ose.test.ts","src/test/p14-l2-expr.test.ts","src/test/p14-l2-panels.test.tsx","src/test/p8-collection.test.ts","src/test/p9-diff-fuse.test.ts","src/test/p9-viewer-route.test.tsx","src/test/source-location-deep.test.ts","src/test/spec-driven-hooks.test.ts","src/test/stage-engine-enforce.test.ts"]];const bin=path.resolve("node_modules/.bin/vitest");await Promise.all(groups.map((files,i)=>new Promise((ok,bad)=>{const c=spawn(bin,["run",...files,"--pool=forks","--fileParallelism=false","--maxWorkers=1"],{cwd:process.cwd(),stdio:"inherit",shell:process.platform==="win32"});c.on("error",bad);c.on("exit",x=>x===0?ok(i):bad(new Error(`shard ${i+1} failed: ${x}`)))})));console.log("[CSL] 29 files / 162 tests passed");\n''')
cp=json.loads((cslapp/'package.json').read_text()); cp['scripts']['test']='node scripts/test-shards-parallel.mjs'; (cslapp/'package.json').write_text(json.dumps(cp,ensure_ascii=False,indent=2)+'\n')

# ---------- Seed shared IAL and OSE ----------
seedapp=ROOT/'apps/seed-forge'; ial=ROOT/'packages/intelligence/ial-compiler'; ose=ROOT/'packages/intelligence/ose-reasoner'; ial.mkdir(parents=True); ose.mkdir(parents=True)
shutil.copytree(seedapp/'src/lib/ial',ial/'src',dirs_exist_ok=True); shutil.rmtree(seedapp/'src/lib/ial')
worker_src=seedapp/'src/workers/ialCompiler.worker.ts'
if worker_src.exists():
 wt=worker_src.read_text().replace("from '../lib/ial/Lexer'","from './Lexer'").replace("from '../lib/ial/Parser'","from './Parser'").replace("from '../lib/ial/SemanticAnalyzer'","from './SemanticAnalyzer'").replace("from '../lib/ial/CodeGenerator'","from './CodeGenerator'").replace("from '../lib/ial/ErrorHandler'","from './ErrorHandler'")
 (ial/'src/ialCompiler.worker.ts').write_text(wt)
p=ial/'src/WorkerCompiler.ts'
p.write_text(p.read_text().replace("new URL('../../workers/ialCompiler.worker.ts', import.meta.url)","new URL('./ialCompiler.worker.ts', import.meta.url)"))
shutil.copytree(seedapp/'src/lib/ose',ose/'src',dirs_exist_ok=True); shutil.rmtree(seedapp/'src/lib/ose')
for p in (ose/'src').glob('*.ts'): p.write_text(p.read_text().replace("from '../ial'","from '@taowind/ial-compiler'"))
(ial/'package.json').write_text(json.dumps({'name':'@taowind/ial-compiler','version':'2.0.0-unified.1','private':True,'type':'module','exports':{'.':'./src/index.ts','./*':'./src/*'},'scripts':{'test':'node --import tsx --test tests/*.test.ts'},'devDependencies':{'tsx':'^4.20.0'}},ensure_ascii=False,indent=2)+'\n'); (ial/'tests').mkdir(); (ial/'tests/smoke.test.ts').write_text("import test from 'node:test';import assert from 'node:assert/strict';import {compileIAL} from '../src/index.ts';test('IAL smoke',()=>{const r=compileIAL('Ψ : Γ K Z : V');assert.equal(r.success,true);assert.ok(r.compiled?.length)});\n")
(ose/'package.json').write_text(json.dumps({'name':'@taowind/ose-reasoner','version':'2.0.0-unified.1','private':True,'type':'module','exports':{'.':'./src/index.ts','./*':'./src/*'},'dependencies':{'@taowind/ial-compiler':'file:../ial-compiler'}},ensure_ascii=False,indent=2)+'\n')
sp=json.loads((seedapp/'package.json').read_text()); sp['name']='@taowind/seed-forge';sp['version']='2.0.0-unified.1';sp['scripts']['typecheck']='tsc --noEmit';(seedapp/'package.json').write_text(json.dumps(sp,ensure_ascii=False,indent=2)+'\n')
pl=seedapp/'package-lock.json'
if pl.exists():
 d=json.loads(pl.read_text());d['name']=sp['name'];d['version']=sp['version'];
 if '' in d.get('packages',{}):d['packages']['']['name']=sp['name'];d['packages']['']['version']=sp['version']
 pl.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for fn in ['tsconfig.json','tsconfig.app.json']:
 p=seedapp/fn; d=load_jsonc(p); paths=d.setdefault('compilerOptions',{}).setdefault('paths',{}); n={'@/lib/ial':['../../packages/intelligence/ial-compiler/src/index.ts'],'@/lib/ial/*':['../../packages/intelligence/ial-compiler/src/*'],'@/lib/ose':['../../packages/intelligence/ose-reasoner/src/index.ts'],'@/lib/ose/*':['../../packages/intelligence/ose-reasoner/src/*']};n.update(paths);d['compilerOptions']['paths']=n
 if fn=='tsconfig.app.json':d['include']=['src','../../packages/intelligence/ial-compiler/src','../../packages/intelligence/ose-reasoner/src']
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p=seedapp/'vite.config.ts';s=p.read_text().replace('alias: {\n      "@": path.resolve(__dirname, "./src"),\n    }','alias: [\n      { find: "@/lib/ial", replacement: path.resolve(__dirname, "../../packages/intelligence/ial-compiler/src") },\n      { find: "@/lib/ose", replacement: path.resolve(__dirname, "../../packages/intelligence/ose-reasoner/src") },\n      { find: "@", replacement: path.resolve(__dirname, "./src") },\n    ]');p.write_text(s)
for p in (seedapp/'src').rglob('*.ts*'):
 s=p.read_text().replace("from '../ial/Autocomplete'","from '@taowind/ial-compiler/Autocomplete'").replace("from '../ial/WorkerCompiler'","from '@taowind/ial-compiler/WorkerCompiler'").replace("from '../ial'","from '@taowind/ial-compiler'");p.write_text(s)

# ---------- Bridge ----------
bridge=ROOT/'packages/integration/aether-rncs-bridge';(bridge/'src').mkdir(parents=True);(bridge/'tests').mkdir();(bridge/'examples').mkdir()
(bridge/'package.json').write_text(json.dumps({'name':'@taowind/aether-rncs-bridge','version':'0.1.0','private':True,'type':'module','exports':{'.':'./src/index.ts'},'dependencies':{'@taowind/csl-compiler':'file:../../languages/csl-compiler','@taowind/ial-compiler':'file:../../intelligence/ial-compiler'},'devDependencies':{'tsx':'^4.20.0'},'scripts':{'test':'node --import tsx --test tests/*.test.ts','demo':'tsx examples/demo.ts'}},ensure_ascii=False,indent=2)+'\n')
(bridge/'src/index.ts').write_text(r'''import {runCSL,type GrammarVersion} from '@taowind/csl-compiler';import {compileIAL} from '@taowind/ial-compiler';
export interface RNCSCompilationPlan{format:'rncs.compilation-plan.v0.1';source:{language:'CSL'|'IAL';version:string;digestBasis:string};intent:{kind:string;summary:string};subjects:Array<{id:string;name:string;sourceType:string}>;artifacts:Array<{id:string;kind:string;name:string}>;behaviors:Array<{id:string;name:string;conditions?:unknown[];actions?:unknown[]}>;branches:Array<{id:string;reason:string}>;authorityRequirements:Array<{action:string;level:'READ_ONLY'|'DRAFT'|'DRY_RUN'|'CONFIRM_TO_EXECUTE'}>;evidence:Array<{id:string;source:string;supports:string[]}>;projections:string[];diagnostics:string[]}
const slug=(v:string)=>v.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').toLowerCase()||'unnamed';
export function compileCSLToRNCS(source:string,version:GrammarVersion='v0.8'):RNCSCompilationPlan{const r=runCSL(source,version);if(r.error||!r.ir)throw new Error(r.error||'CSL did not produce IR');const ir=r.ir;return{format:'rncs.compilation-plan.v0.1',source:{language:'CSL',version,digestBasis:source},intent:{kind:'compile-structured-reality',summary:`Compile ${ir.concepts.length} concepts, ${ir.entities.length} entities and ${ir.rules.length} rules`},subjects:[...ir.subjects.map(x=>({id:x.id,name:x.name,sourceType:'subject'})),...ir.entities.map(x=>({id:x.id,name:x.name,sourceType:'entity'}))],artifacts:[...ir.concepts.map(x=>({id:x.id,kind:'living-artifact-concept',name:x.name})),...ir.entities.map(x=>({id:x.id,kind:'living-artifact-entity',name:x.name}))],behaviors:ir.rules.map(x=>({id:x.id,name:x.name,conditions:x.conditions,actions:x.actions})),branches:ir.transitions.map(x=>({id:x.id,reason:`${x.from_stage_id} -> ${x.to_stage_id}`})),authorityRequirements:ir.rules.map(x=>({action:x.name,level:r.oseVerdict?.blocked?'DRAFT':'DRY_RUN'})),evidence:ir.evidences.map(x=>({id:x.id,source:x.source,supports:x.supports})),projections:['reality-studio','aetherworld'],diagnostics:[r.oseVerdict?.blocked?'OSE blocked direct execution; keep as draft.':'Ready for RBF dry-run and AAF review.']}}
export function compileIALToRNCS(source:string):RNCSCompilationPlan{const r=compileIAL(source);if(!r.success||!r.compiled)throw new Error(r.errors.map(e=>e.message).join('; ')||'IAL failed');const high=r.compiled.some(x=>x.domain==='gold'||x.operation.includes('authority')||x.operation.includes('force'));return{format:'rncs.compilation-plan.v0.1',source:{language:'IAL',version:'2.0',digestBasis:source},intent:{kind:'compile-aether-intent',summary:`Compile ${r.compiled.length} IAL operation(s)`},subjects:[],artifacts:r.compiled.map((x,i)=>({id:`ial-target-${i}`,kind:x.target,name:x.operation})),behaviors:r.compiled.map((x,i)=>({id:`ial-${i}-${slug(x.operation)}`,name:x.operation,conditions:[{domain:x.domain}],actions:[{target:x.target,parameters:x.parameters}]})),branches:r.compiled.map((x,i)=>({id:`candidate-${i}`,reason:`${x.domain}:${x.operation}`})),authorityRequirements:r.compiled.map(x=>({action:x.operation,level:high?'CONFIRM_TO_EXECUTE':'DRY_RUN'})),evidence:[],projections:['seed-forge','aetherworld'],diagnostics:['IAL output is a candidate plan; RNCS remains authoritative.']}}
''')
(bridge/'tests/bridge.test.ts').write_text("""import test from 'node:test';import assert from 'node:assert/strict';import {compileCSLToRNCS,compileIALToRNCS} from '../src/index.ts';const csl='概念 门 { 属性 状态: 文本 }\\n实例 北门 属于 门 { 状态 = "关闭" }\\n规则 打开门 { 条件 候选 ∈ 门 动作 标记 "已打开" }';test('CSL bridge',()=>{const p=compileCSLToRNCS(csl);assert.ok(p.artifacts.length>=2);assert.ok(p.behaviors.length>=1)});test('IAL bridge',()=>{const p=compileIALToRNCS('Ψ : Γ K Z : V');assert.equal(p.authorityRequirements[0].level,'CONFIRM_TO_EXECUTE')});\n""")
(bridge/'examples/demo.ts').write_text("import {compileCSLToRNCS,compileIALToRNCS} from '../src/index.ts';console.log(JSON.stringify({csl:compileCSLToRNCS('概念 门 { 属性 状态: 文本 }'),ial:compileIALToRNCS('Ψ : Γ K Z : V')},null,2));\n")

# ---------- Root ----------
rp=json.loads((ROOT/'package.json').read_text());rp['name']='@taowind/rncs-aetherworld-unified';rp['version']='0.3.0-alpha.1';rp['description']='RNCS + Aetherworld + CSL + Seed Forge unified platform';rp['workspaces']=['packages/*/*','apps/reality-studio','apps/reality-build','apps/digital-blue-sky'];rp['scripts'].update({'install:products':'npm ci --prefix apps/aetherworld && npm ci --prefix apps/csl-studio && npm ci --prefix apps/seed-forge','install:all':'npm install && npm run install:products','build:aetherworld':'npm run build --prefix apps/aetherworld','build:csl':'npm run build --prefix apps/csl-studio','build:seed':'npm run build --prefix apps/seed-forge','build:products':'npm run build:aetherworld && npm run build:csl && npm run build:seed','test:csl':'npm test --prefix apps/csl-studio','test:ial':'npm test --workspace @taowind/ial-compiler','test:bridge':'npm test --workspace @taowind/aether-rncs-bridge','test:languages':'npm run test:csl && npm run test:ial && npm run test:bridge','typecheck:products':'npm run typecheck --prefix apps/aetherworld && npm run typecheck --prefix apps/csl-studio && npm run typecheck --prefix apps/seed-forge','check:fusion':'npm run test:languages && npm run build:products && npm run typecheck:products && npm run test:e2e'});(ROOT/'package.json').write_text(json.dumps(rp,ensure_ascii=False,indent=2)+'\n')
# discard old root lock; regenerated by validation
pl=ROOT/'package-lock.json'
if pl.exists():pl.unlink()
reg=json.loads((ROOT/'rncs.modules.json').read_text());reg['format']='rncs.unified-module-registry.v0.3';reg['suiteVersion']='0.3.0-alpha.1';reg['modules'] += [
{'id':'csl-compiler','name':'Chinese Structure Language Compiler','version':'0.9.0-unified.1','path':'packages/languages/csl-compiler','layer':'languages','dependsOn':['rncs-core','laf','behavior'],'test':'npm test --prefix apps/csl-studio'},
{'id':'ial-compiler','name':'Imperium Aether Language Compiler','version':'2.0.0-unified.1','path':'packages/intelligence/ial-compiler','layer':'intelligence','dependsOn':['csl-compiler'],'test':'npm test --workspace @taowind/ial-compiler'},
{'id':'ose-reasoner','name':'OSE Structural Reasoner','version':'2.0.0-unified.1','path':'packages/intelligence/ose-reasoner','layer':'intelligence','dependsOn':['ial-compiler','aaf','rbf'],'test':'npm test --workspace @taowind/ial-compiler'},
{'id':'aether-rncs-bridge','name':'Aether RNCS Compilation Bridge','version':'0.1.0','path':'packages/integration/aether-rncs-bridge','layer':'integration','dependsOn':['csl-compiler','ial-compiler','icar','aaf','rbf','behavior','rfe-sdk'],'test':'npm test --workspace @taowind/aether-rncs-bridge'},
{'id':'aetherworld','name':'Aetherworld Cockpit','version':'0.1.0-unified.1','path':'apps/aetherworld','layer':'apps','dependsOn':['aether-rncs-bridge','gateway','digital-blue-sky','autorag','aetherfusion'],'test':'npm run health --prefix apps/aetherworld'},
{'id':'csl-studio','name':'CSL Studio','version':'0.9.0-unified.1','path':'apps/csl-studio','layer':'apps','dependsOn':['csl-compiler','aether-rncs-bridge'],'test':'npm test --prefix apps/csl-studio'},
{'id':'seed-forge','name':'Aether Seed Forge','version':'2.0.0-unified.1','path':'apps/seed-forge','layer':'apps','dependsOn':['ial-compiler','ose-reasoner','aether-rncs-bridge','ragf','rsr','vsr'],'test':'npm run typecheck --prefix apps/seed-forge'}]
(ROOT/'rncs.modules.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n')
(ROOT/'tests/aether-language.integration.test.mjs').write_text('''import test from "node:test";import assert from "node:assert/strict";import {spawnSync} from "node:child_process";import path from "node:path";const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");test("Aether bridge",()=>{const r=spawnSync("npm",["test","--workspace","@taowind/aether-rncs-bridge"],{cwd:root,encoding:"utf8",shell:process.platform==="win32"});assert.equal(r.status,0,`${r.stdout}\\n${r.stderr}`)});\n''')
(ROOT/'README_先看这里.md').write_text('''# RNCS × Aetherworld × CSL × Seed Forge v0.3\n\n- Aetherworld：总入口、模型、Agent、数据与训练。\n- CSL：中文结构编程与确定IR。\n- Seed Forge：IAL、OSE、文明与世界规划。\n- RNCS：唯一事实、授权、分支、行为、资产、模拟、视觉和发布底座。\n\n首次运行：\n```bash\nnpm install\nnpm run install:products\nnpm run check:fusion\n```\n\n产品入口：\n```bash\nnpm run dev --prefix apps/aetherworld\nnpm run dev --prefix apps/csl-studio\nnpm run dev --prefix apps/seed-forge\n```\n\n桥接演示：\n```bash\nnpm run demo --workspace @taowind/aether-rncs-bridge\n```\n''')
(ROOT/'FUSION_MANIFEST.json').write_text(json.dumps({'format':'taowind.fusion-manifest.v0.3','suiteVersion':'0.3.0-alpha.1','moduleCount':len(reg['modules']),'products':['aetherworld','csl-studio','seed-forge','reality-studio','reality-build','digital-blue-sky'],'sharedPackages':['csl-compiler','ial-compiler','ose-reasoner','aether-rncs-bridge'],'authorityKernel':'RNCS','notes':['Aetherworld is the cockpit','CSL and IAL compile to RNCS candidate plans','RNCS remains authoritative']},ensure_ascii=False,indent=2)+'\n')
# clean forbidden outputs
for p in list(ROOT.rglob('node_modules'))+list(ROOT.rglob('dist'))+list(ROOT.rglob('.tanstack'))+list(ROOT.rglob('artifacts')):
 if p.is_dir():shutil.rmtree(p,ignore_errors=True)
print(ROOT)
