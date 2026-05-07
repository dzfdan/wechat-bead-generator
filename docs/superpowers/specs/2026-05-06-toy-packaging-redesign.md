# Toy Packaging Redesign

## Context

The current Mini Program UI is functional but visually generic. Both the index page and result page use plain white cards, standard blue buttons, and minimal hierarchy. That makes the app usable, but it does not express the project's character as a bead-art generator with playful, collectible, and DIY qualities.

The user wants the current Mini Program screens redesigned, and after narrowing direction they approved a "trend toy packaging" visual language. The redesign should cover both the index page and the result page together so the experience feels like one coherent product rather than two separate screens.

## Goals

- Redesign the index page and result page with a distinctive toy-packaging aesthetic.
- Keep the current user flow intact: select image, choose size, generate result, inspect preview and guide, save output.
- Make the app feel more memorable, playful, and branded without reducing readability.
- Preserve the current two-output result model: effect preview and reference guide.
- Improve visual hierarchy so primary actions and content blocks are clearer at a glance.

## Non-Goals

- Changing generation logic, result data shape, or rendering behavior.
- Adding new product features, filters, or editor controls.
- Redesigning the app into a dark neon arcade style or minimalist editorial style.
- Reintroducing removed outputs such as pegboard preview.

## Experience Direction

The app should feel like opening a collectible DIY toy package.

The strongest reference is not a generic dashboard, but a bright physical product box: bold title blocks, sticker-like labels, chunky rounded corners, strong contrast, and playful framing around the user's uploaded image and generated outputs.

The memorable hook should be: **the whole interface looks like a collectible craft toy kit, not a utility form**.

## Visual Language

### Tone
- playful
- bright
- tactile
- collectible
- youthful but not childish

### Color direction
Use a bold, warm, toy-inspired palette instead of the current cool blue utility palette.

Recommended palette roles:
- background cream or warm off-white
- one coral/red-orange brand color
- one bright yellow accent
- one clean cyan or sky-blue support color
- deep ink color for strong text and borders

Color should be used in clear blocks, badges, chips, and action areas rather than soft enterprise gradients.

### Shape language
- large rounded corners
- visible borders
- layered cards
- sticker-like chips and labels
- stronger frame treatment around image and canvas areas

### Typography hierarchy
The current typography is too plain. The redesign should create stronger hierarchy through:
- larger hero title
- compact uppercase or short-label style section markers where appropriate
- stronger contrast between title, supporting text, and metadata

The WeChat Mini Program environment limits font loading in practice, so the design should rely on size, weight, spacing, casing, and framing rather than assuming custom web fonts.

## Page Design

### Index page

The index page should become a branded onboarding surface rather than a stack of generic cards.

#### Proposed structure
1. Hero section
2. Upload card
3. Size selector card
4. Primary generate action area

#### Hero section
Include:
- product-like title
- one short supporting sentence
- one or two decorative labels or badges

This area should immediately communicate that the app turns photos into bead-art references.

#### Upload card
The uploaded image preview should feel like the cover art inside toy packaging.

Requirements:
- empty state still looks designed, not blank
- selected image sits inside a framed display area
- upload button remains obvious and easy to tap

#### Size selector
The size chips should feel like collectible option tokens rather than standard pills.

Requirements:
- active state should be high-contrast and immediately visible
- spacing should support quick scanning
- chips should feel tactile and playful

#### Generate action
The generate button should be the strongest visual action on the page.

Requirements:
- visually separated from secondary content
- wording and styling should feel like a "start making" action
- loading state must remain legible

### Result page

The result page should feel like opening the package and seeing the included contents arranged in themed cards.

#### Proposed structure
1. Result summary header
2. Effect preview display card
3. Reference guide display card
4. Usage statistics card
5. Save action area

#### Result summary header
Add a more expressive top section that frames the generated output as a finished kit result.

Include:
- page title
- short explanatory line
- small badges if helpful, such as selected size or output summary

#### Preview and guide cards
These should be visually related but clearly differentiated.

Requirements:
- both remain easy to read
- card framing is stronger than today
- titles and helper text explain the difference between preview and guide
- preview remains compact in meaning, guide remains reference-oriented in meaning

#### Usage statistics
The usage list should feel closer to a color parts inventory.

Requirements:
- color swatch remains prominent
- code/name and count are easier to scan
- rows feel designed rather than plain list items

#### Save action
The save button should read as the final high-value action.

Requirements:
- visually strong
- separated from the inventory list
- consistent with homepage CTA language and style

## Motion and polish

The implementation should stay lightweight, but the static layout should imply motion through layered blocks, offsets, and contrast.

If small transitions are already available through normal WeChat state changes, they may be used conservatively for:
- active chip changes
- button pressed states
- card emphasis

Do not introduce heavy animation systems.

## Content and copy direction

The copy should remain concise and product-like.

Good traits:
- short labels
- confident section titles
- clear action language

Avoid:
- long instructional paragraphs
- enterprise dashboard wording
- overly childish phrases

## Technical approach

The redesign should be implemented only through page markup and WXSS styling changes unless a small supporting data field is needed for presentation.

Expected primary files:
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `pages/result/index.wxml`
- `pages/result/index.wxss`

The redesign should preserve current bindings and existing canvas IDs so current tests and rendering behavior remain stable unless specific tests are intentionally updated for structure changes.

## Verification

After implementation, verify:
- both pages still support the current flow
- the result page still exposes only preview, guide, usage list, and save action
- canvas IDs remain correct for preview, guide, and export
- the layout works on common mobile widths
- existing tests are updated only where structure changes require it
