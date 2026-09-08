import {runReality, createProviderRuntimeV2} from '@taowind/reality-computation-language';
import {clone, GenesisError, rootHash, seal, verifySeal} from './canonical.mjs';
import {executeVisualFactory} from './visual-factory.mjs';

export async function executeVisualFactoryRCL(plan, adapters, {policy, timeoutMs=30000, replay=true}={}) {
  plan=clone(plan); adapters={...adapters};
  if(!verifySeal(plan,'plan_root')) throw new GenesisError('VISUAL_PLAN_ROOT');
  const source=`reality VisualFactory {
    facet visual.receipt : Text = "pending"
    subject builder { warrant visual.factory on visual }
    host visual { offers execute -> Text }
    emergence produce {
      cause builder
      when visual.receipt == "pending"
      needs visual.factory on visual
      call visual.execute(${JSON.stringify(plan.plan_root)}) -> visual.receipt
      preserve length(visual.receipt) > 0
      witness "visual-factory:candidate-execution"
    }
    realize produce
  }`;
  const providerRuntime=createProviderRuntimeV2({timeoutMs,policy:clone(policy??{subjects:{}}),providers:[{
    id:'visual',version:'0.1',capabilities:[{capability:'execute',target:'visual',modes:['realize'],effects:['HostCall','Evidence'],maxConcurrent:1}],
    async invoke(input, context) {
      if(input.args?.[0]!==plan.plan_root) throw new GenesisError('VISUAL_RCL_PLAN_BINDING');
      return JSON.stringify(await executeVisualFactory(plan,adapters,{timeoutMs,replay,signal:context.signal}));
    }
  }]});
  const execution=await runReality(source,{hostAdapters:{visual:providerRuntime.hostAdapter('visual')}});
  const factory_result=JSON.parse(execution.state['visual.receipt']);
  return seal({format:'ragf.visual-rcl-execution.v0.1',status:factory_result.status,candidate_only:true,
    runtime:'RCL_JS_REFERENCE_HOST_CALL',source,source_root:rootHash(source),plan_root:plan.plan_root,
    provider_receipts:providerRuntime.getEventLog(),factory_result},'bridge_root');
}
