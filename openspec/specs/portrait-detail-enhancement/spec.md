## ADDED Requirements

### Requirement: Portrait facial features remain distinguishable after quantization
The system SHALL preserve key portrait facial features during bead generation so that eyes, lips, nose shadow, and jaw contour remain distinguishable in both the preview grid and the reference board.

#### Scenario: Eye detail survives cleanup
- **WHEN** a compact high-contrast eye detail appears near the portrait center after color mapping
- **THEN** the cleanup stage MUST preserve that detail instead of merging it into the surrounding skin tone

#### Scenario: Lip contrast survives cleanup
- **WHEN** a compact lip or mouth-edge detail is represented by a centered high-contrast cluster
- **THEN** the generated portrait MUST retain that contrast rather than flattening it into adjacent skin colors

### Requirement: Hair tones retain visible layering
The system SHALL preserve visible layering in portrait hair regions so that hair highlights, midtones, and shadows do not collapse into a single flat color band.

#### Scenario: Blonde hair retains highlight and shadow separation
- **WHEN** sampled hair pixels contain both light blonde tones and darker shadow tones
- **THEN** the generated output MUST keep at least two visually distinct hair layers in the resulting grid

#### Scenario: Hair-adjacent accessory edge remains visible
- **WHEN** a small accessory or outline detail sits next to the hair region and contrasts with it
- **THEN** the system MUST preserve that edge if it contributes to portrait readability

### Requirement: Portrait-detail enhancement must preserve the existing two-output flow
The system SHALL improve portrait clarity without changing the current two-output result experience of effect preview plus reference guide.

#### Scenario: Preview and reference grid both benefit from detail preservation
- **WHEN** a portrait result is generated after the enhancement
- **THEN** the effect preview MUST use the preserved portrait detail grid for compact subject preview
- **AND** the reference guide MUST use the preserved portrait detail grid embedded into the centered board layout

#### Scenario: Detail enhancement does not reintroduce removed outputs
- **WHEN** portrait-detail enhancement is enabled in the generation pipeline
- **THEN** the result page MUST still expose only the effect preview and the reference guide outputs
