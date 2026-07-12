import {useEffect,useMemo,useState} from "react";
import {rncsGateway} from "@/lib/rncsNativeGateway";
const SAMPLE="创建一座小型以太岛。岛上有两个玩家出生点、一扇可开关的门、一盏蓝色能量灯和一个感应区域。玩家进入感应区域时，门自动打开，灯光增强并产生环境声音。两个客户端必须看到一致的门状态和玩家位置。";
const Card=({title,children}:{title:string;children:React.ReactNode})=><section className="rounded-xl border border-border/60 bg-card/70 p-4"><h2 className="font-display text-lg mb-3">{title}</h2>{children}</section>;
const Json=({value}:{value:any})=><pre className="max-h-72 overflow-auto rounded bg-background/70 p-3 text-[11px] whitespace-pre-wrap">{value?JSON.stringify(value,null,2):"暂无运行时数据"}</pre>;
export function RNCSWorldCockpit(){
 const [source,setSource]=useState(SAMPLE),[status,setStatus]=useState<any>(),[plan,setPlan]=useState<any>(),[candidate,setCandidate]=useState<any>(),[simulation,setSimulation]=useState<any>(),[authority,setAuthority]=useState<any>(),[result,setResult]=useState<any>(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const candidateId=candidate?.candidate_id;
 const call=async<T,>(fn:()=>Promise<T>)=>{setBusy(true);setError("");try{return await fn();}catch(e){setError(e instanceof Error?e.message:String(e));throw e;}finally{setBusy(false)}};
 const refresh=()=>call(async()=>setStatus({discovery:await rncsGateway.discover(),world:await rncsGateway.invoke("worldStatus"),history:await rncsGateway.invoke("history")}));
 useEffect(()=>{refresh().catch(()=>undefined)},[]);
 const steps=useMemo(()=>[
  ["编译",async()=>setPlan(await rncsGateway.invoke("compile",{source}))],
  ["候选分支",async()=>setCandidate(await rncsGateway.invoke("createCandidate",{plan}))],
  ["模拟",async()=>setSimulation(await rncsGateway.invoke("simulateCandidate",{candidateId}))],
  ["AAF授权",async()=>setAuthority(await rncsGateway.invoke("authorizeCandidate",{candidateId,approvalRoles:["owner","security"]}))],
  ["注册行为",async()=>setResult(await rncsGateway.invoke("registerBehavior",{candidateId}))],
  ["合并并提交RFE",async()=>setResult(await rncsGateway.invoke("mergeCandidate",{candidateId}))],
  ["双客户端运行",async()=>setResult(await rncsGateway.invoke("runLoopback",{}))]
 ],[plan,candidateId]);
 return <div className="space-y-4">
  <div className="flex flex-wrap gap-2"><button className="rounded bg-primary px-3 py-2 text-primary-foreground" onClick={()=>refresh()} disabled={busy}>发现运行时</button><button className="rounded border px-3 py-2" onClick={()=>call(async()=>{const x=await rncsGateway.invoke("runEndToEnd",{source});setResult(x);await refresh()})} disabled={busy}>一键完整验收</button><span className="text-xs text-muted-foreground self-center">{busy?"运行中":"真实 Gateway · 无静态权威数据"}</span></div>
  {error&&<div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm">{error}</div>}
  <div className="grid gap-4 xl:grid-cols-2">
   <Card title="世界制造"><textarea className="min-h-32 w-full rounded border bg-background p-3 text-sm" value={source} onChange={e=>setSource(e.target.value)}/><div className="mt-3 flex flex-wrap gap-2">{steps.map(([label,fn])=><button key={label as string} className="rounded border px-3 py-1.5 text-sm" onClick={()=>call(fn as any)} disabled={busy}>{label as string}</button>)}</div><h3 className="mt-4 text-sm font-medium">Compilation Plan</h3><Json value={plan}/><h3 className="mt-4 text-sm font-medium">候选分支 / Diff / 风险</h3><Json value={candidate||simulation||authority}/></Card>
   <Card title="世界状态与证据"><Json value={status?.world}/><h3 className="mt-4 text-sm font-medium">运行时发现</h3><Json value={status?.discovery}/></Card>
   <Card title="投影诊断"><Json value={result?.loopback?.projection||result?.projection}/><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div>Authority Root<br/><code>{result?.loopback?.authority?.state_root||result?.authority?.state_root||"-"}</code></div><div>Presentation Root<br/><code>{result?.loopback?.projection?.presentation_root||result?.projection?.presentation_root||"-"}</code></div></div></Card>
   <Card title="历史、恢复与重放"><Json value={status?.history}/><div className="mt-3 flex gap-2"><button className="rounded border px-3 py-1.5 text-sm" onClick={()=>call(async()=>{const h=await rncsGateway.invoke<any[]>("history");if(h.length)await rncsGateway.invoke("rollbackGeneration",{generationId:h[0].generation_id,approvalRoles:["owner","security"]});await refresh()})}>回滚首代</button><button className="rounded border px-3 py-1.5 text-sm" onClick={()=>call(async()=>{const h=await rncsGateway.invoke<any[]>("history");const island=[...h].reverse().find((x:any)=>x.world==="world:aether-island");if(island)await rncsGateway.invoke("replayGeneration",{generationId:island.generation_id,approvalRoles:["owner","security"]});await refresh()})}>重放以太岛</button></div></Card>
  </div>
  <Card title="最近运行产物"><Json value={result}/></Card>
 </div>;
}
