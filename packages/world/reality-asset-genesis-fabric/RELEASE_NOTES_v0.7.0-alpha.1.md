# RAGF v0.7.0-alpha.1

## Native Anime multi-frame motion assets

The built-in Anime provider now emits a deterministic motion track and a real PNG frame sequence from the same Character Genome used for the SVG model views and canonical front PNG. Hair sway, coat sway, breathing and blink samples are recorded per frame with state roots and file roots.

The family continuity contract keeps identity, palette, proportions and appearance roots stable while motion and frame roots vary over time. The Provider Manifest declares the PNG sequence and JSON motion track as real media outputs, and remains candidate-only.

The temporal quality boundary is explicit: this proves an executable CPU reference motion path and deterministic replay. It does not prove physical cloth or hair simulation, professional motion capture, commercial Anime source-art quality or human performance acceptance.
