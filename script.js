/**
 * Synth Pomodoro — Pomodoro cycles, localStorage, stats, and session cues
 */

const LOCAL_STORAGE_KEY = "synthPomodoroSettings";
const STATS_KEY = "synthPomodoroStats";

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const FOCUS_BLOCKS_BEFORE_LONG_BREAK = 4;

let isRunning = false;
let isFocusSession = true;
let isLongBreakSession = false;
let remainingSeconds = DEFAULT_FOCUS_MINUTES * 60;

let focusMinutes = DEFAULT_FOCUS_MINUTES;
let breakMinutes = DEFAULT_BREAK_MINUTES;
let longBreakMinutes = DEFAULT_LONG_BREAK_MINUTES;

let completedFocusBlocks = 0;

let intervalId = null;
let flashTimeoutId = null;

let stats = {
  totalSessions: 0,
  totalFocusMinutes: 0,
};

const appContainer = document.getElementById("app-container");
const timerDisplay = document.getElementById("timer-display");
const sessionIndicator = document.getElementById("session-indicator");
const cycleIndicator = document.getElementById("cycle-indicator");

const focusInput = document.getElementById("focus-minutes-input");
const breakInput = document.getElementById("break-minutes-input");
const longBreakInput = document.getElementById("long-break-minutes-input");

const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

const sessionSound = document.getElementById("session-sound");

const statsSessionsElement = document.getElementById("stats-sessions");
const statsMinutesElement = document.getElementById("stats-minutes");
const clearStatsButton = document.getElementById("clear-stats-button");

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) throw new Error("missing");
    const data = JSON.parse(raw);
    const f = Number(data.focusMinutes);
    const b = Number(data.breakMinutes);
    const lb =
      data.longBreakMinutes != null
        ? Number(data.longBreakMinutes)
        : DEFAULT_LONG_BREAK_MINUTES;

    if (!Number.isFinite(f) || f < 1) throw new Error("bad focus");
    if (!Number.isFinite(b) || b < 1) throw new Error("bad break");
    if (!Number.isFinite(lb) || lb < 1) throw new Error("bad long break");

    focusMinutes = clamp(Math.floor(f), 1, 180);
    breakMinutes = clamp(Math.floor(b), 1, 60);
    longBreakMinutes = clamp(Math.floor(lb), 1, 60);
  } catch {
    focusMinutes = DEFAULT_FOCUS_MINUTES;
    breakMinutes = DEFAULT_BREAK_MINUTES;
    longBreakMinutes = DEFAULT_LONG_BREAK_MINUTES;
  }

  if (focusInput) focusInput.value = String(focusMinutes);
  if (breakInput) breakInput.value = String(breakMinutes);
  if (longBreakInput) longBreakInput.value = String(longBreakMinutes);

  isFocusSession = true;
  isLongBreakSession = false;
  completedFocusBlocks = 0;
  remainingSeconds = focusMinutes * 60;
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        focusMinutes,
        breakMinutes,
        longBreakMinutes,
      })
    );
  } catch {
    /* quota or private mode */
  }
}

function validateAndApplyInputs() {
  const parseBounded = (input, fallback, min, max) => {
    if (!input) return fallback;
    const n = parseInt(String(input.value).trim(), 10);
    if (Number.isNaN(n)) return fallback;
    return clamp(n, min, max);
  };

  focusMinutes = parseBounded(focusInput, focusMinutes, 1, 180);
  breakMinutes = parseBounded(breakInput, breakMinutes, 1, 60);
  longBreakMinutes = parseBounded(longBreakInput, longBreakMinutes, 1, 60);

  if (focusInput) focusInput.value = String(focusMinutes);
  if (breakInput) breakInput.value = String(breakMinutes);
  if (longBreakInput) longBreakInput.value = String(longBreakMinutes);

  if (!isRunning) {
    if (isFocusSession) {
      remainingSeconds = focusMinutes * 60;
    } else if (isLongBreakSession) {
      remainingSeconds = longBreakMinutes * 60;
    } else {
      remainingSeconds = breakMinutes * 60;
    }
  }

  return { focusMinutes, breakMinutes, longBreakMinutes };
}

function loadStats() {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const ts = Number(parsed.totalSessions);
    const tm = Number(parsed.totalFocusMinutes);
    if (Number.isFinite(ts) && Number.isFinite(tm)) {
      stats = {
        totalSessions: Math.max(0, Math.floor(ts)),
        totalFocusMinutes: Math.max(0, Math.floor(tm)),
      };
    }
  } catch {
    /* invalid */
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* quota or private mode */
  }
}

function updateStatsUI() {
  if (statsSessionsElement) {
    statsSessionsElement.textContent = String(stats.totalSessions);
  }
  if (statsMinutesElement) {
    statsMinutesElement.textContent = String(stats.totalFocusMinutes);
  }
}

function incrementStatsOnSessionComplete() {
  stats.totalSessions += 1;
  stats.totalFocusMinutes += focusMinutes;
  saveStats();
  updateStatsUI();
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function updateCycleIndicator() {
  if (!cycleIndicator) return;
  const displayBlock = completedFocusBlocks + 1;
  cycleIndicator.textContent = `Focus block ${displayBlock} of ${FOCUS_BLOCKS_BEFORE_LONG_BREAK}`;
}

function updateDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }
  if (sessionIndicator) {
    if (isFocusSession) {
      sessionIndicator.textContent = "FOCUS";
    } else if (isLongBreakSession) {
      sessionIndicator.textContent = "LONG BREAK";
    } else {
      sessionIndicator.textContent = "BREAK";
    }
  }

  let titleLabel = "FOCUS";
  if (!isFocusSession) {
    titleLabel = isLongBreakSession ? "LONG BREAK" : "BREAK";
  }
  document.title = `[${titleLabel}] ${formatTime(remainingSeconds)} – Synth Pomodoro`;

  updateCycleIndicator();
}

function applySessionTheme() {
  if (!appContainer) return;
  appContainer.classList.remove("focus-mode", "break-mode", "long-break-mode");
  if (isFocusSession) {
    appContainer.classList.add("focus-mode");
  } else if (isLongBreakSession) {
    appContainer.classList.add("long-break-mode");
  } else {
    appContainer.classList.add("break-mode");
  }
}

function playSessionSound() {
  if (!sessionSound) return;
  sessionSound.currentTime = 0;
  sessionSound.play().catch(() => {});
}

function flashSessionIndicator() {
  if (!sessionIndicator) return;
  if (flashTimeoutId !== null) {
    clearTimeout(flashTimeoutId);
  }
  sessionIndicator.classList.add("session-flash");
  flashTimeoutId = window.setTimeout(() => {
    sessionIndicator.classList.remove("session-flash");
    flashTimeoutId = null;
  }, 350);
}

function handleFocusFinished() {
  incrementStatsOnSessionComplete();

  completedFocusBlocks += 1;

  if (completedFocusBlocks >= FOCUS_BLOCKS_BEFORE_LONG_BREAK) {
    completedFocusBlocks = 0;
    isFocusSession = false;
    isLongBreakSession = true;
    remainingSeconds = longBreakMinutes * 60;
  } else {
    isFocusSession = false;
    isLongBreakSession = false;
    remainingSeconds = breakMinutes * 60;
  }

  applySessionTheme();
  playSessionSound();
  flashSessionIndicator();
  updateDisplay();
}

function handleBreakFinished() {
  isFocusSession = true;
  isLongBreakSession = false;
  remainingSeconds = focusMinutes * 60;

  applySessionTheme();
  playSessionSound();
  flashSessionIndicator();
  updateDisplay();
}

function tick() {
  if (!isRunning) return;

  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    updateDisplay();
    return;
  }

  if (isFocusSession) {
    handleFocusFinished();
  } else {
    handleBreakFinished();
  }
}

function setInputsDisabled(disabled) {
  if (focusInput) focusInput.disabled = disabled;
  if (breakInput) breakInput.disabled = disabled;
  if (longBreakInput) longBreakInput.disabled = disabled;
}

function startTimer() {
  if (isRunning) return;

  validateAndApplyInputs();
  saveSettingsToStorage();

  setInputsDisabled(true);

  isRunning = true;
  if (startButton) startButton.textContent = "Pause";

  if (intervalId !== null) {
    clearInterval(intervalId);
  }
  intervalId = window.setInterval(tick, 1000);
  updateDisplay();
}

function pauseTimer() {
  if (!isRunning) return;

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;

  setInputsDisabled(false);

  if (startButton) startButton.textContent = "Start";

  updateDisplay();
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;

  isFocusSession = true;
  isLongBreakSession = false;
  completedFocusBlocks = 0;

  validateAndApplyInputs();
  remainingSeconds = focusMinutes * 60;

  setInputsDisabled(false);

  if (startButton) startButton.textContent = "Start";

  if (sessionIndicator) {
    sessionIndicator.classList.remove("session-flash");
  }
  if (flashTimeoutId !== null) {
    clearTimeout(flashTimeoutId);
    flashTimeoutId = null;
  }

  applySessionTheme();
  updateDisplay();
}

function handleStartButtonClick() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function handleResetButtonClick() {
  resetTimer();
}

function handleInputBlurOrChange() {
  if (!isRunning) {
    validateAndApplyInputs();
    updateDisplay();
    saveSettingsToStorage();
  }
}

function handleClearStats() {
  stats.totalSessions = 0;
  stats.totalFocusMinutes = 0;
  saveStats();
  updateStatsUI();
}

function init() {
  if (
    !appContainer ||
    !timerDisplay ||
    !sessionIndicator ||
    !cycleIndicator ||
    !focusInput ||
    !breakInput ||
    !longBreakInput ||
    !startButton ||
    !resetButton
  ) {
    return;
  }

  loadSettingsFromStorage();
  loadStats();
  applySessionTheme();
  updateDisplay();
  updateStatsUI();

  startButton.addEventListener("click", handleStartButtonClick);
  resetButton.addEventListener("click", handleResetButtonClick);

  focusInput.addEventListener("change", handleInputBlurOrChange);
  focusInput.addEventListener("blur", handleInputBlurOrChange);
  breakInput.addEventListener("change", handleInputBlurOrChange);
  breakInput.addEventListener("blur", handleInputBlurOrChange);
  longBreakInput.addEventListener("change", handleInputBlurOrChange);
  longBreakInput.addEventListener("blur", handleInputBlurOrChange);

  if (clearStatsButton) {
    clearStatsButton.addEventListener("click", handleClearStats);
  }
}

document.addEventListener("DOMContentLoaded", init);
