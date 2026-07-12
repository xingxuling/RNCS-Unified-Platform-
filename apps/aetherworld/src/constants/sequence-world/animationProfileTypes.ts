export interface AnimationDigitHint {
  digit: string;
  movement: string;
  idle: string;
  transition: string;
  camera: string;
  keywords: string[];
}
export const DIGIT_ANIMATION_HINTS: Record<string, AnimationDigitHint> = {
  "0": { digit:"0", movement:"slow/halted", idle:"stillness", transition:"fade to black", camera:"static long take", keywords:["freeze","fade"] },
  "1": { digit:"1", movement:"straight/sharp", idle:"upright stance", transition:"snap cut", camera:"hero push-in", keywords:["sharp","authority"] },
  "2": { digit:"2", movement:"approach/respond", idle:"facing partner", transition:"cross-dissolve", camera:"two-shot", keywords:["pair","sync"] },
  "3": { digit:"3", movement:"gesture-rich", idle:"hand cues", transition:"glyph reveal", camera:"floating UI orbit", keywords:["expressive","symbolic"] },
  "4": { digit:"4", movement:"mechanical/steady", idle:"locked posture", transition:"grid wipe", camera:"static framed", keywords:["ordered","framed"] },
  "5": { digit:"5", movement:"quick cut / spin", idle:"shifting weight", transition:"whip pan", camera:"handheld dynamic", keywords:["burst","wind"] },
  "6": { digit:"6", movement:"breathing/soft", idle:"calm sway", transition:"slow crossfade", camera:"gentle dolly", keywords:["recover","breath"] },
  "7": { digit:"7", movement:"stealth/observe", idle:"low crouch", transition:"shadow dissolve", camera:"voyeur low-angle", keywords:["hidden","slow"] },
  "8": { digit:"8", movement:"heavy/grounded", idle:"weighted stance", transition:"weighted slide", camera:"low wide shot", keywords:["weight","gravity"] },
  "9": { digit:"9", movement:"ceremonial/slow", idle:"ritual pose", transition:"halo wipe", camera:"slow orbit / crane", keywords:["ritual","grand"] },
};
