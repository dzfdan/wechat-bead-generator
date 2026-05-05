# Upload Ignore Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the WeChat Mini Program project so upload packaging excludes only the `tests/` and `docs/` directories.

**Architecture:** This is a single-file configuration change in `project.config.json`. The implementation updates `packOptions.ignore` only, preserving all existing runtime and packaging behavior outside those two ignored directories.

**Tech Stack:** WeChat Mini Program project config JSON

---

## Planned File Structure

- Modify: `project.config.json`

### Task 1: Add upload ignore entries

**Files:**
- Modify: `project.config.json`

- [ ] **Step 1: Inspect the existing upload package config**

Read `project.config.json` and confirm `packOptions.ignore` is currently empty while `packOptions.include` remains empty.

- [ ] **Step 2: Update the ignore entries**

Change `packOptions` to:

```json
"packOptions": {
  "ignore": [
    {
      "type": "folder",
      "value": "tests"
    },
    {
      "type": "folder",
      "value": "docs"
    }
  ],
  "include": []
}
```

- [ ] **Step 3: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('node:fs').readFileSync('project.config.json', 'utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Verify the config contains only the required ignore entries**

Run: `node -e "const c=JSON.parse(require('node:fs').readFileSync('project.config.json','utf8')); console.log(JSON.stringify(c.packOptions))"`
Expected: output shows only `tests` and `docs` in `packOptions.ignore`, with `include` still empty

## Self-Review Checklist

- **Spec coverage:** The task modifies only `project.config.json`, adds ignore rules for `tests/` and `docs/`, and leaves all runtime code untouched.
- **Placeholder scan:** No placeholders or deferred instructions remain.
- **Type consistency:** The ignore entries use the same `packOptions` object and preserve `include` as an empty array.
