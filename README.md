# Synth Pomodoro

Retro **Synthwave**–styled Pomodoro timer built with plain **HTML**, **CSS**, and **vanilla JavaScript**—no frameworks or build step.

## How to run

- **Direct:** double-click `index.html` or open it from your browser (File → Open).
- **Local server (optional):** from this folder run:
  - `python3 -m http.server 8080` then visit `http://localhost:8080`
  - or `npx --yes serve .` if you use Node.

## Features

### Stats panel

- Tracks **total completed focus sessions** (count) and **total accumulated focus minutes** (sum of configured focus lengths for each completed focus block).
- Stats are stored in `localStorage` under `synthPomodoroStats` and persist across visits.
- **Clear Stats** resets only these counters; timer **settings** (`synthPomodoroSettings`) are unchanged.

### Enhanced behaviour

- **Persisted settings** — focus and break durations are saved in `localStorage` (key `synthPomodoroSettings`) and restored when you open the app again.
- **Session sound** — a short click plays when the timer switches between focus and break (placeholder WAV via data URL; replace the `<audio>` source later for a custom asset).
- **Tab title** — the document title shows `[FOCUS] MM:SS – Synth Pomodoro` or `[BREAK] MM:SS – Synth Pomodoro` so you can glance at progress from other tabs.
- **Session flash** — the session pill briefly animates when the mode changes.

**Limitations:** no long-break logic yet; the cue sound is a minimal placeholder; some browsers may block audio until there has been a user gesture (subsequent switches usually work after you’ve pressed Start once).

- **Configurable durations** — focus and break lengths (1–180 minutes each), validated on Start; invalid values fall back to **25** / **5** minutes.
- **Start / Pause** — one primary control toggles the countdown; durations are locked while the timer is running.
- **Reset** — stops the timer, returns to **FOCUS**, and restores the remaining time to the current focus duration from the inputs.
- **Automatic cycling** — when focus hits zero, switch to break; when break hits zero, switch back to focus (infinite loop).
- **Visual feedback** — focus vs break styling (neon colours, glow), session pill, optional title bar updates, brief flash on session change.

This is a **proof of concept** you can extend (sounds, long breaks, persistence, PWA, etc.).

## Files

| File        | Role                          |
| ----------- | ----------------------------- |
| `index.html` | Page structure and controls  |
| `styles.css` | Synthwave layout and themes  |
| `script.js`  | Timer state and behaviour    |
