# Voice Performance Runtime

Reference Voice Forge contract for one authoritative dialogue take, PCM WAV output, transcript, phoneme and viseme timelines, prosody and evidence roots. The built-in provider is deterministic synthetic audio and is not a human performance substitute.

Timeline metadata remains Cut-local and authoritative. PCM generation uses local buffer coordinates, so dialogue beginning after frame zero is still non-silent and can be placed by Audio Forge at its editorial offset.
