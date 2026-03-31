# Synth Pomodoro

A **Synthwave**-styled **Pomodoro timer** built with plain **HTML**, **CSS**, and **vanilla JavaScript**. There is no build step or framework; the app is static and works on **GitHub Pages** or any static host.

## Features

- **Synthwave UI** — Neon gradients, glow, and distinct styling for focus, short break, and long break.
- **Configurable durations** — Focus (1–180 minutes), short break (1–60 minutes), and long break (1–60 minutes), with defaults of **25 / 5 / 15** minutes.
- **Pomodoro cycles** — After each completed focus session, a short break runs. After **four** completed focus blocks in a row, the next break is a **long break**; the focus-block counter then resets for the next cycle.
- **Cycle indicator** — Shows which focus block you are on within the current cycle (for example, “Focus block 3 of 4”).
- **Start / Pause and Reset** — Start toggles the countdown; Reset returns to a fresh focus session at the configured focus length and resets the cycle counter.
- **Session switch sound** — A short cue plays when the session type changes (placeholder WAV via data URL; you can swap the `<audio>` source for a custom file).
- **Stats** — Total completed focus sessions and total focus minutes, stored in the browser.
- **Persistence** — Timer settings and stats are saved in **localStorage** and restored when you open the app again.

## Immersive Focus Mode

When a **focus** session is **running** (timer active, not on a break), the app adds an `immersive-mode` class to the main card: the layout tightens, secondary sections (subtitle, cycle indicator, duration inputs, and stats) **fade and collapse**, and the **timer readout scales up** with a smooth transition. **Pause**, **Reset**, or switching to a **short or long break** removes immersive mode and restores the full UI.

## Analytics

The **Insights** section in the stats panel uses **per-day** focus data stored under the same `synthPomodoroStats` key as lifetime totals:

- **Today** — Focus minutes and session count for the current **calendar day** (in your local timezone).
- **Last 7 days** — Sum of focus minutes across the **last seven calendar days**, including today.
- **Streak** — Number of **consecutive calendar days ending today** on which you completed at least one focus session. If you have no sessions today, the streak is **0**.

All of this is **local to your browser** only. **Clear Stats** resets lifetime totals **and** the per-day map (`days`), in addition to clearing the Insights display; timer **settings** are not affected.

To keep storage bounded, per-day analytics retain only the most recent **730 calendar days**; older day entries are pruned automatically during stats load/save. Lifetime totals (`totalSessions`, `totalFocusMinutes`) are preserved and are **not** reduced by pruning.

## How it works

The app counts **completed focus sessions** in the current cycle. When a focus timer reaches zero, that counts as one completed block, stats are updated, and the block counter increases. After blocks **1–3**, the next segment is a **short break**. After the **fourth** completed focus block in the cycle, the counter resets and the next segment is a **long break**. When any break ends, the timer returns to **focus** for the next block.

The line under the timer (for example, “Focus block 2 of 4”) reflects position in the cycle: during breaks it indicates the **next** focus block you are working toward.

## Running locally

- **Direct:** Open `index.html` in your browser (double-click or File → Open).
- **Static server (optional):** From the project folder, for example:
  - `python3 -m http.server 8080` then visit `http://localhost:8080`
  - or `npx --yes serve .` if you use Node.

Using a local server avoids edge cases with `file://` URLs; for day-to-day use, opening the file directly is usually fine.

## Deployment

This project is a single-page static site. **GitHub Pages** is a common choice: push the repository, enable Pages for the branch or folder that contains `index.html`, and the app will load from the published URL. Any static host (Netlify, Cloudflare Pages, etc.) works the same way.

## Storage keys

| Key | Purpose |
| --- | --- |
| `synthPomodoroSettings` | Focus, short break, and long break lengths (minutes) |
| `synthPomodoroStats` | Lifetime totals plus a `days` object: ISO date keys (`YYYY-MM-DD`) mapped to `{ sessions, minutes }` |

**Clear Stats** resets lifetime stats and all per-day analytics; timer settings are unchanged.
Per-day entries in `synthPomodoroStats.days` are automatically pruned to the most recent **730 days**; lifetime totals are kept intact.

## Files

| File | Role |
| --- | --- |
| `index.html` | Structure, controls, audio, script include |
| `styles.css` | Synthwave layout and focus / break / long-break themes |
| `script.js` | Timer logic, cycles, persistence, stats |

Some browsers may block audio until there has been a user gesture (for example, pressing Start); after that, session-change sounds usually play normally.
