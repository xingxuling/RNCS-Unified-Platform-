# Phase 6.2 Verification Matrix

| Gate | Evidence | Initial state | Green condition |
| --- | --- | --- | --- |
| Single morphology authority | canonical asset root and compiler test | RED | one compiler output owns static structure |
| Genome drives geometry | variant Genome property test | RED | legal variants change geometry |
| Hierarchical skeleton | bone parent/local/FK test | RED | world joints are FK-derived |
| Volume layer | volume continuity tests | RED | skeleton does not draw capsules directly |
| Surface continuity | connected contour and self-intersection tests | RED | surface passes certificate |
| Face surface | skull-local feature tests | RED | eyes/nose/mouth/jaw share face hierarchy |
| Scalp attachment | root-to-scalp distance tests | RED | every root is within tolerance |
| Garment attachment | coat offset surface tests | RED | coat follows body anchors |
| Renderer independence | static dependency and adapter tests | RED | renderer has no anatomy decisions |
| Property fuzz | 1000 genomes x 3 poses x 3 cameras | GREEN locally | compile or explicit reject, never silent render |
| Validation pack | 10 views with canonical/posed/projected/certificate/raster files | GREEN locally | every view has certificate and raster |
| Five-second shot | 120 frames across 3 derived Cuts | GREEN locally for frame sequence; media blocked locally | real MP4 and audio are reproducible when FFmpeg/ffprobe are present |
| SHA-256 manifest | file-hash-manifest.json plus verifier | GREEN locally | every listed file hash and manifest root validate |
| Visual review | contact sheet and action frame inspected | candidate | human acceptance remains separate |
| Human visual acceptance | Art Director, Animation Director, Technical Art, Creative Production Review | pending | body, face, hair, joints, hands and weight read as one character |

## Failure boundary

Any false core certificate gate rejects the morphology candidate before the
formal renderer. If the final image still shows a disassembled body after
automated gates pass, Creative Production Review remains FAIL and Phase 6.2
does not advance to Phase 7.
