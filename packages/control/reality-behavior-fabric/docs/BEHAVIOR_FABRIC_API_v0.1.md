# Reality Behavior Fabric API v0.1

## Program

```js
import {normalizeProgram, validateProgram} from './src/index.mjs';
const program = normalizeProgram({...});
const report = validateProgram(program);
```

## Runtime

```js
import {BehaviorRuntime} from './src/index.mjs';
const runtime = new BehaviorRuntime(program, {
  actor: {subject_id:'subject:runtime', roles:['runtime'], scopes:['gameplay.*']},
  providers: {
    'experience.audio.emit': ({inputs}) => ({accepted:true, ...inputs})
  }
});
runtime.tick({move_right:true});
```

## Snapshot / Restore

```js
const snapshot = runtime.snapshot();
runtime.restore(snapshot);
```

## Replay

```js
import {replayProgram} from './src/index.mjs';
const replayed = replayProgram(program, runtime.state.input_log, {providers});
```

## Hot Reload

```js
runtime.hotReload(nextProgram);
```

## Adapters

```js
createRsrCommandBatch(runtime);
createVsrDocument(runtime,{observer:'player'});
createStudioImport(runtime,{trace:'trace.json'});
createWorkspace({runtime,outputs});
```

## Action Types

`set`、`add`、`multiply`、`clamp`、`emit`、`schedule`、`transition`、`if`、`spawn`、`destroy`、`move_toward`、`damage`、`call`、`trace`、`stop`。

## Behavior Tree Nodes

`condition`、`action`、`wait`、`sequence`、`selector`、`inverter`、`repeat`、`parallel`。
