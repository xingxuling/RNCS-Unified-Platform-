# Codebase Archaeology v0.12

RAGF already emitted a real GLB with skeleton, skin weights and animation data, but the VSR importer ignored JOINTS_0, WEIGHTS_0, skins, inverse bind matrices and quaternion channels. Reality Studio had Sequencer animation tracks but no character animation session. The minimum production change was therefore to preserve the existing world and authority contracts while adding the missing character deformation and authoring path.
