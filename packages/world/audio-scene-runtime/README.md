# Audio Scene Runtime

Reference Audio Forge contract for dialogue, ambience, foley, SFX, music and master WAV stems. It records ducking, spatial layout, loudness targets and deterministic audio roots. External mastering and licensed source audio remain separate provider gates.

Phase 3 groups take authority by dialogue event, permits multiple distinct dialogue events, and builds one production sound scene from every Cut. Dialogue WAV data is inserted at `Cut editorial offset + authoritative start_seconds`; duplicate active takes for the same event remain a hard failure.
