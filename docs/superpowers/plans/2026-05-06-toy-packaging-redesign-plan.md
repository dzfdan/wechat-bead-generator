# Toy Packaging Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Mini Program index page and result page into a bold toy-packaging style while preserving the current flow and rendering behavior.

**Architecture:** Keep all generation logic and canvas behavior intact, and focus the change on WXML structure, WXSS styling, and any minimal presentation-only text needed in page templates. Apply the new visual system consistently across both pages so they feel like one product family.

**Tech Stack:** WeChat Mini Program WXML, WXSS, existing page tests with Node test runner

---

### Task 1: Lock homepage structure with tests first

**Files:**
- Modify: `tests/pages/index.test.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

- [ ] **Step 1: Write the failing homepage structure assertions**

Update `tests/pages/index.test.js` to assert the homepage template includes the new packaging-style sections while preserving the hidden canvas and image workflow hooks.

Add or update assertions like:

```js
assert.match(template, /class="hero"/);
assert.match(template, /class="hero-badge"/);
assert.match(template, /class="upload-stage"/);
assert.match(template, /class="size-panel"/);
assert.match(template, /class="generate-panel"/);
assert.match(template, /id="sourceCanvas"/);
```

- [ ] **Step 2: Run the homepage test to verify failure**

Run:

```bash
node --test tests/pages/index.test.js
```

Expected: FAIL because the new classes are not yet present in `pages/index/index.wxml`.

- [ ] **Step 3: Implement the homepage WXML redesign**

Rewrite `pages/index/index.wxml` into a branded structure that still binds to `chooseImage`, `onSizeChange`, `generateResult`, `imagePath`, `sizeOptions`, `selectedSize`, and `generating`.

The final structure should follow this shape:

```xml
<view class="page">
  <view class="hero">
    <view class="hero-badge">DIY TOY KIT</view>
    <view class="hero-title">把照片变成拼豆收藏卡</view>
    <view class="hero-subtitle">上传图片，选择尺寸，生成效果预览和参考图。</view>
  </view>

  <view class="upload-stage">
    <view class="section-kicker">IMAGE</view>
    <view class="section-title">上传本地图片</view>
    <button class="primary-button" bindtap="chooseImage">选择图片</button>
    <view class="preview-frame">
      <image wx:if="{{imagePath}}" class="preview" src="{{imagePath}}" mode="aspectFit" />
      <view wx:else class="preview-empty">等待放入主视觉</view>
    </view>
  </view>

  <view class="size-panel">
    <view class="section-kicker">SIZE</view>
    <view class="section-title">选择拼豆尺寸</view>
    <view class="size-list">
      <!-- existing wx:for structure retained -->
    </view>
  </view>

  <view class="generate-panel">
    <view class="generate-copy">准备好后开始生成你的拼豆套装</view>
    <button class="primary-button primary-button--generate" loading="{{generating}}" bindtap="generateResult">开始生成</button>
  </view>

  <canvas id="sourceCanvas" type="2d" class="hidden-canvas"></canvas>
</view>
```

- [ ] **Step 4: Implement the homepage WXSS redesign**

Update `pages/index/index.wxss` with a toy-packaging visual system using warm background, bold borders, large rounded corners, chips, and framed preview treatment.

Include styles for:

```css
.page
.hero
.hero-badge
.hero-title
.hero-subtitle
.upload-stage
.size-panel
.generate-panel
.section-kicker
.section-title
.preview-frame
.preview-empty
.preview
.size-list
.size-chip
.size-chip--active
.primary-button
.primary-button--generate
.hidden-canvas
```

Keep the hidden canvas off-screen exactly as before.

- [ ] **Step 5: Run the homepage test to verify pass**

Run:

```bash
node --test tests/pages/index.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/pages/index.test.js pages/index/index.wxml pages/index/index.wxss
git commit -m "feat: redesign homepage as toy packaging"
```

### Task 2: Lock result page structure with tests first

**Files:**
- Modify: `tests/pages/result.test.js`
- Modify: `pages/result/index.wxml`
- Modify: `pages/result/index.wxss`

- [ ] **Step 1: Write the failing result-page structure assertions**

Update `tests/pages/result.test.js` so the template test asserts the new themed layout markers while preserving the same canvas IDs.

Add assertions like:

```js
assert.match(template, /class="result-hero"/);
assert.match(template, /class="display-card display-card--preview"/);
assert.match(template, /class="display-card display-card--guide"/);
assert.match(template, /class="usage-card"/);
assert.match(template, /class="save-panel"/);
assert.match(template, /id="previewCanvas"/);
assert.match(template, /id="guideCanvas"/);
assert.match(template, /id="exportCanvas"/);
```

- [ ] **Step 2: Run the result-page test to verify failure**

Run:

```bash
node --test tests/pages/result.test.js
```

Expected: FAIL because the new classes are not yet present.

- [ ] **Step 3: Implement the result-page WXML redesign**

Rewrite `pages/result/index.wxml` so the page has a toy-kit reveal structure while keeping `result`, `result.usage`, and `saveImage` bindings intact.

The final structure should follow this shape:

```xml
<view class="page" wx:if="{{result}}">
  <view class="result-hero">
    <view class="hero-badge">KIT READY</view>
    <view class="hero-title">你的拼豆套装已生成</view>
    <view class="hero-subtitle">先看效果，再照参考图开始制作。</view>
  </view>

  <view class="display-card display-card--preview">
    <view class="section-kicker">PREVIEW</view>
    <view class="section-title">拼豆效果图</view>
    <view class="section-note">用于快速查看整体成品气质</view>
    <canvas id="previewCanvas" type="2d" class="preview-canvas"></canvas>
  </view>

  <view class="display-card display-card--guide">
    <view class="section-kicker">GUIDE</view>
    <view class="section-title">网格色号图</view>
    <view class="section-note">用于照图摆放和核对色号</view>
    <canvas id="guideCanvas" type="2d" class="preview-canvas"></canvas>
  </view>

  <view class="usage-card">
    <view class="section-kicker">PARTS</view>
    <view class="section-title">颜色用量统计</view>
    <!-- existing usage loop retained -->
  </view>

  <view class="save-panel">
    <button class="primary-button" bindtap="saveImage">保存高清拼豆图</button>
  </view>

  <canvas id="exportCanvas" type="2d" class="hidden-canvas"></canvas>
</view>
```

- [ ] **Step 4: Implement the result-page WXSS redesign**

Update `pages/result/index.wxss` to visually match the homepage language.

Include styles for:

```css
.page
.result-hero
.hero-badge
.hero-title
.hero-subtitle
.display-card
.display-card--preview
.display-card--guide
.usage-card
.save-panel
.section-kicker
.section-title
.section-note
.preview-canvas
.usage-row
.swatch
.usage-text
.usage-count
.primary-button
.hidden-canvas
```

Keep canvas dimensions readable and mobile-safe, and preserve the hidden export canvas behavior.

- [ ] **Step 5: Run the result-page test to verify pass**

Run:

```bash
node --test tests/pages/result.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/pages/result.test.js pages/result/index.wxml pages/result/index.wxss
git commit -m "feat: redesign result page as toy packaging"
```

### Task 3: Full regression verification and polish

**Files:**
- Verify: `pages/index/index.wxml`
- Verify: `pages/index/index.wxss`
- Verify: `pages/result/index.wxml`
- Verify: `pages/result/index.wxss`
- Verify: `tests/pages/index.test.js`
- Verify: `tests/pages/result.test.js`

- [ ] **Step 1: Re-check binding safety**

Confirm these bindings and IDs are still present after redesign:

```text
chooseImage
onSizeChange
generateResult
saveImage
imagePath
sizeOptions
selectedSize
generating
result.usage
sourceCanvas
previewCanvas
guideCanvas
exportCanvas
```

- [ ] **Step 2: Run focused page tests**

Run:

```bash
node --test tests/pages/index.test.js tests/pages/result.test.js
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass with no failures.

- [ ] **Step 4: Review against the approved spec**

Manually verify the implementation matches these approved outcomes:

```text
- homepage and result page share one toy-packaging visual language
- current flow is unchanged
- only two result outputs remain
- no generation logic was modified
- no removed output was reintroduced
```

- [ ] **Step 5: Commit**

```bash
git add pages/index/index.wxml pages/index/index.wxss pages/result/index.wxml pages/result/index.wxss tests/pages/index.test.js tests/pages/result.test.js
git commit -m "test: verify toy packaging redesign"
```
