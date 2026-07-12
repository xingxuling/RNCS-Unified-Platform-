export interface AudioAtmosphereHint {
  digit: string;
  ambient: string;
  musicMood: string;
  instrumentation: string[];
  silenceLevel: number;
  intensity: number;
}

export const DIGIT_AUDIO_HINTS: Record<string, AudioAtmosphereHint> = {
  "0": { digit: "0", ambient: "silent_void", musicMood: "absence", instrumentation: ["sub_drone", "wind_noise"], silenceLevel: 0.9, intensity: 0.1 },
  "1": { digit: "1", ambient: "core_pulse", musicMood: "sovereign", instrumentation: ["low_drum", "tonic_note"], silenceLevel: 0.4, intensity: 0.6 },
  "2": { digit: "2", ambient: "dual_call", musicMood: "answering", instrumentation: ["choir_pair", "string_duet"], silenceLevel: 0.4, intensity: 0.5 },
  "3": { digit: "3", ambient: "info_chime", musicMood: "transmission", instrumentation: ["bell", "synth_pad"], silenceLevel: 0.3, intensity: 0.6 },
  "4": { digit: "4", ambient: "mechanical_beat", musicMood: "institutional", instrumentation: ["clock_bell", "drum_kit"], silenceLevel: 0.3, intensity: 0.6 },
  "5": { digit: "5", ambient: "wind_burst", musicMood: "explosive", instrumentation: ["fast_drum", "rising_synth"], silenceLevel: 0.1, intensity: 0.9 },
  "6": { digit: "6", ambient: "warm_pad", musicMood: "nurturing", instrumentation: ["warm_pad", "soft_strings"], silenceLevel: 0.3, intensity: 0.4 },
  "7": { digit: "7", ambient: "low_whisper", musicMood: "dreamlike", instrumentation: ["reverse_pad", "whisper"], silenceLevel: 0.6, intensity: 0.3 },
  "8": { digit: "8", ambient: "metal_forge", musicMood: "weighty", instrumentation: ["anvil", "sub_bass"], silenceLevel: 0.2, intensity: 0.7 },
  "9": { digit: "9", ambient: "ritual_chorus", musicMood: "sacred", instrumentation: ["choir", "orchestra", "bell"], silenceLevel: 0.2, intensity: 0.8 },
};
