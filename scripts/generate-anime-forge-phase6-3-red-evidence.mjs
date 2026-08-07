import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAnatomySystem,poseForFrame} from '../packages/world/native-character-morphogenesis-runtime/src/anatomy.mjs';
import {projectFrameGeometry} from '../packages/world/native-character-morphogenesis-runtime/src/projection.mjs';
import {measureGeometricTruth,validateGeometricTruthMeasurements} from '../packages/world/native-character-morphogenesis-runtime/src/geometric-truth.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const phase62Root=path.join(repoRoot,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1');
const fixtureRoot=path.join(phase62Root,'morphology-regression-fixture');
const outputRoot=path.join(repoRoot,'evidence/anime-forge-phase6-3-geometric-truth-v0.1');
const fixturePath=path.join(fixtureRoot,'fixture.json');
const visualReviewPath=path.join(phase62Root,'visual-review.json');
const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const visualReview=JSON.parse(fs.readFileSync(visualReviewPath,'utf8'));
const imagePath=path.join(fixtureRoot,'phase6-1-supplied-frame.png');
const imageSha256=fs.existsSync(imagePath)?crypto.createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex'):null;

const system=createAnatomySystem();
const pose=poseForFrame(system,{view:'three-quarter-right',pose:'neutral',frame:0,totalFrames:120});
const projected=projectFrameGeometry(pose.geometry,{width:640,height:360,yaw:pose.view_yaw,pitch:0,scale:1});
const measurements=measureGeometricTruth({asset:system.canonical_morphology_asset,pose,geometry:pose.geometry,projected,source_image:fixture.source_asset});
const validation=validateGeometricTruthMeasurements(measurements);
if(!validation.valid)throw new Error(`GEOMETRIC_TRUTH_MEASUREMENT_INVALID:${validation.errors.join(',')}`);

fs.mkdirSync(outputRoot,{recursive:true});
const failure={format:'rncs.anime-forge-phase6-2-failure-measurements.v0.1',phase:'6.2',baseline_commit:'34b4e3825091890961e7a222506c3f3e21eb183e',source_fixture:{fixture_id:fixture.fixture_id,source_asset:fixture.source_asset,source_sha256:fixture.source_sha256,observed_image_sha256:imageSha256,source_kind:fixture.source_kind,observed_failures:fixture.observed_failures},phase62_visual_review:{status:visualReview.status,human_visual_acceptance:visualReview.human_visual_acceptance,review_root:visualReview.review_root,post_fix_boundary:visualReview.post_fix_boundary},measurement_input:{view:pose.view,pose:pose.pose,frame:pose.frame,camera:projected.camera},old_kernel:measurements,interpretation:'Measured RED feedback for the supplied Phase 6.2 rejection fixture and the current contour output. This is not an anime quality score and does not automate human acceptance.',status:'red'};
const rejection={format:'rncs.anime-forge-human-rejection-regression-report.v0.1',review_id:'AF-PHASE6-3-GEOMETRIC-TRUTH-001',formal_review:{status:'revision-requested',decision:'rejected-for-phase6-3-acceptance',basis:['phase6-2-supplied-frame','measured-old-kernel-red','missing-canonical-surface','missing-depth-visibility']},fixture_id:fixture.fixture_id,phase62_failure_measurements:'phase6-2-failure-measurements.json',red_metrics:measurements.red_metrics,required_next_gate:'native-field-mesh-visibility-static-gates',human_visual_acceptance:'pending',commercial_animation_quality:'not-proven'};
fs.writeFileSync(path.join(outputRoot,'phase6-2-failure-measurements.json'),`${JSON.stringify(failure,null,2)}\n`);
fs.writeFileSync(path.join(outputRoot,'human-rejection-regression-report.json'),`${JSON.stringify(rejection,null,2)}\n`);
console.log(JSON.stringify({outputRoot,status:measurements.status,red_metrics:measurements.red_metrics,count:measurements.red_metrics.length,source_sha256:imageSha256},null,2));
