---
name: cove-config
description: >-
  Configure Cove from code through `~/.cove/config.json` and `orca config`:
  footer widgets (order, visibility, left/center/right alignment), usage meters,
  focus session length, clock format and time zones, sidebar items, sidebar
  and explorer open state, theme, window material, font, and any app setting
  by key. Use when the user asks to customize, rearrange,
  show, hide, or align parts of the Cove interface, or to set an app setting
  without opening Settings. The running app applies valid changes live.
---

# Cove Config

Cove reads a declarative JSONC file and applies it live while the app runs. Edit it with
`ORCA config`, which validates every write, instead of hand-editing when you can.

`ORCA` is a placeholder for the executable you resolved in the stub; substitute it before running.

## Commands

```bash
ORCA config path --json            # file and schema locations, and whether the file exists
ORCA config init                   # commented starter file; refuses if one exists (--force replaces it)
ORCA config list                   # every set value as `path = JSON`; --json gives [{path,value}]
ORCA config get --json             # the whole config
ORCA config get footer.widgets     # one value; `config show` is an alias
ORCA config set <path> <value>     # JSON values are parsed; anything else is a string
ORCA config unset <path>           # remove a key so the in-app setting applies again
ORCA config validate               # report issues with line numbers; non-zero exit when invalid
ORCA config schema                 # JSON Schema for every key
```

Paths are dotted; array items take an index: `footer.widgets.0.align` or `footer.widgets[0].align`.
Quote JSON values for the shell: `ORCA config set footer.usage '["claude","codex"]'`.

An invalid result is never written. The file keeps its comments and formatting, and the
app keeps the last valid configuration until the file validates again.

## What each section controls

| Key                      | Values                                                                                                                           | Effect                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `footer.widgets`         | array of `{ "id", "align"? }`                                                                                                    | Footer widgets in display order. Widgets left out are hidden. Once present, the file owns the footer and menu changes write back to it. |
| `footer.widgets[].id`    | `weather`, `clock`, `focus`, `note`, `usage`, `keep-awake`, `updates`, `pet`, `resources`, `ports`, `hosts`, `floating-terminal` | Each id may appear once. `pet`, `floating-terminal` and `keep-awake` render only when that feature is on.                               |
| `footer.widgets[].align` | `start`, `center`, `end`                                                                                                         | Left, center or right zone. Defaults to `start`.                                                                                        |
| `footer.focus.minutes`   | integer 1–180                                                                                                                    | Length of a focus session. Defaults to 25. The footer menu presets still pick a one-off length.                                         |
| `footer.clock.hour12`    | boolean                                                                                                                          | 12-hour (`true`) or 24-hour (`false`) clock. Defaults to the system locale.                                                             |
| `footer.clock.seconds`   | boolean                                                                                                                          | Show seconds in the footer clock.                                                                                                       |
| `footer.clock.timeZones` | up to 3 IANA names, e.g. `Europe/Madrid`                                                                                         | Extra cities listed in the clock's calendar popover. Unknown names fail validation.                                                     |
| `footer.usage`           | `claude`, `codex`, `gemini`, `antigravity`, `opencode-go`, `kimi`, `minimax`, `grok`, `cursor`, `zcode`                          | Usage meters inside the `usage` widget.                                                                                                 |
| `sidebar.open`           | boolean                                                                                                                          | Left sidebar open state, applied at launch and whenever the value changes.                                                              |
| `sidebar.appName`        | boolean                                                                                                                          | App name in the sidebar header.                                                                                                         |
| `sidebar.items.<id>`     | boolean, ids `tasks`, `automations`, `artifacts`, `skills`, `mobile`                                                             | Show or hide a navigation item.                                                                                                         |
| `explorer.open`          | boolean                                                                                                                          | Right explorer open state.                                                                                                              |
| `appearance.theme`       | `system`, `dark`, `light`                                                                                                        | Theme.                                                                                                                                  |
| `appearance.material`    | `solid`, `glass`                                                                                                                 | Window material.                                                                                                                        |
| `appearance.font`        | string                                                                                                                           | Interface font family.                                                                                                                  |
| `settings.<key>`         | the setting's own type                                                                                                           | Any app setting by key, for example `"terminalFontSize": 13`. Unknown keys and values of the wrong type are ignored.                    |

Keys you leave out keep whatever the user chose in the app. The file only overrides what it declares.

## Recipes

Put usage on the left, the clock on the right, and hide everything else:

```bash
ORCA config set footer.widgets '[{"id":"usage"},{"id":"clock","align":"end"}]'
```

Move one existing widget without rewriting the list: read it, then set that item's `align`.

```bash
ORCA config get footer.widgets --json
ORCA config set footer.widgets.1.align center
```

Start from a commented file when none exists, then see what is set:

```bash
ORCA config init
ORCA config list
```

Fifty-minute focus sessions and a 24-hour clock with seconds and two extra cities:

```bash
ORCA config set footer.focus.minutes 50
ORCA config set footer.clock '{"hour12":false,"seconds":true,"timeZones":["Europe/Madrid","Asia/Tokyo"]}'
```

Hide sidebar items and switch theme:

```bash
ORCA config set sidebar.items.automations false
ORCA config set appearance.theme dark
```

Hand the footer back to the in-app menu:

```bash
ORCA config unset footer.widgets
```

## Rules

- Read before you write: run `ORCA config get --json` so you edit the user's current layout rather than replacing it.
- After a change, run `ORCA config validate`. When it fails, fix the reported line instead of retrying the same value.
- The file lives on this machine. `COVE_CONFIG_DIR` moves its folder, for example for a dev profile; pass the same variable to the CLI when the app was started with it.
- Do not edit `settings` keys you cannot name from `ORCA config schema` or the user's request; unknown keys are ignored, so a typo fails silently.
