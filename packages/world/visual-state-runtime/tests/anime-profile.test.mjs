import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnimeRenderingProfile,resolveAnimeCamera,validateAnimeRenderingProfile} from '../src/anime-profile.mjs';

test('VSR Anime Profile seals Episode composition and eased camera evidence',()=>{
  const profile=createAnimeRenderingProfile({profileId:'phase4',fps:24,resolution:{width:960,height:540},colourAnchor:'shenlin-cold-court-v1',exposureAnchor:'cold-overcast-v1'}),validation=validateAnimeRenderingProfile(profile),camera=resolveAnimeCamera(profile,[{kind:'dolly_in',start_frame:0,end_frame:23,dolly:.25,easing:'ease_in_out'},{kind:'pan',start_frame:0,end_frame:23,x:.12,y:0}],{frame:12,totalFrames:24});
  assert.equal(validation.valid,true);
  assert.deepEqual(profile.compositing.layer_order,['background','atmosphere','character','foreground','effects','lighting','correction']);
  assert.equal(profile.compositing.cut_seam_policy,'validate-colour-exposure-character-camera');
  assert.equal(profile.authority.scope,'episode-composition');
  assert.ok(camera.dolly>0&&camera.dolly<.25);
  assert.ok(camera.x>0&&camera.x<.12);
  assert.equal(camera.profile_root,profile.profile_root);
  assert.equal(createAnimeRenderingProfile({profileId:'phase4',fps:24,resolution:{width:960,height:540},colourAnchor:'shenlin-cold-court-v1',exposureAnchor:'cold-overcast-v1'}).profile_root,profile.profile_root);
});
