/**
 * Retro Synthwave Pomodoro — timer logic with localStorage and session cues
 */

const LOCAL_STORAGE_KEY = "synthPomodoroSettings";
const STATS_KEY = "synthPomodoroStats";
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

let isRunning = false;
/** Tracks resume-after-pause so restarting does not reset remaining time. */
let isPaused = false;
let isFocusSession = true;
let remainingSeconds = DEFAULT_FOCUS_MINUTES * 60;
let focusMinutes = DEFAULT_FOCUS_MINUTES;
let breakMinutes = DEFAULT_BREAK_MINUTES;
let intervalId = null;

let stats = {
  totalSessions: 0,
  totalFocusMinutes: 0,
};

let flashTimeoutId = null;

const appContainer = document.getElementById("app-container");
const timerDisplay = document.getElementById("timer-display");
const sessionIndicator = document.getElementById("session-indicator");
const focusInput = document.getElementById("focus-minutes-input");
const breakInput = document.getElementById("break-minutes-input");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");
const sessionSound = document.getElementById("session-sound");

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      throw new Error("missing");
    }
    const data = JSON.parse(raw);
    const f = Number(data.focusMinutes);
    const b = Number(data.breakMinutes);
    if (
      !Number.isFinite(f) ||
      !Number.isFinite(b) ||
      f < 1 ||
      f > 180 ||
      b < 1 ||
      b > 180
    ) {
      throw new Error("invalid");
    }
    focusMinutes = f;
    breakMinutes = b;
    if (focusInput) focusInput.value = String(focusMinutes);
    if (breakInput) breakInput.value = String(breakMinutes);
  } catch {
    focusMinutes = DEFAULT_FOCUS_MINUTES;
    breakMinutes = DEFAULT_BREAK_MINUTES;
    if (focusInput) focusInput.value = String(focusMinutes);
    if (breakInput) breakInput.value = String(breakMinutes);
  }
  remainingSeconds = focusMinutes * 60;
  isFocusSession = true;
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ focusMinutes, breakMinutes })
    );
  } catch {
    /* quota or private mode */
  }
}

function loadStats() {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.totalSessions != null && parsed.totalFocusMinutes != null) {
      stats = {
        totalSessions: Number(parsed.totalSessions),
        totalFocusMinutes: Number(parsed.totalFocusMinutes),
      };
    }
  } catch {
    /* invalid or missing */
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
  const sessionsEl = document.getElementById("stats-sessions");
  const minutesEl = document.getElementById("stats-minutes");
  if (sessionsEl) sessionsEl.textContent = String(stats.totalSessions);
  if (minutesEl) minutesEl.textContent = String(stats.totalFocusMinutes);
}

function incrementStatsOnSessionComplete() {
  if (isFocusSession === false) return;
  stats.totalSessions += 1;
  stats.totalFocusMinutes += focusMinutes;
  saveStats();
  updateStatsUI();
}

function validateAndApplyInputs() {
  const parseMin = (input, fallback) => {
    if (!input) return fallback;
    const raw = String(input.value).trim();
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1 || n > 180) {
      return fallback;
    }
    return n;
  };

  focusMinutes = parseMin(focusInput, focusMinutes);
  breakMinutes = parseMin(breakInput, breakMinutes);

  if (focusInput) focusInput.value = String(focusMinutes);
  if (breakInput) breakInput.value = String(breakMinutes);

  if (!isRunning && isFocusSession && !isPaused) {
    remainingSeconds = focusMinutes * 60;
  }

  return { focusMinutes, breakMinutes };
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function updateDisplay() {
  if (!timerDisplay || !sessionIndicator) return;

  timerDisplay.textContent = formatTime(remainingSeconds);
  sessionIndicator.textContent = isFocusSession ? "FOCUS" : "BREAK";

  const label = isFocusSession ? "FOCUS" : "BREAK";
  document.title = `[${label}] ${formatTime(remainingSeconds)} – Synth Pomodoro`;
}

function applySessionTheme() {
  if (!appContainer) return;
  appContainer.classList.remove("focus-mode", "break-mode");
  appContainer.classList.add(isFocusSession ? "focus-mode" : "break-mode");
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

function switchSession() {
  incrementStatsOnSessionComplete();
  isFocusSession = !isFocusSession;
  remainingSeconds = (isFocusSession ? focusMinutes : breakMinutes) * 60;
  applySessionTheme();
  playSessionSound();
  flashSessionIndicator();
  updateDisplay();
}

function tick() {
  if (!isRunning) return;
  remainingSeconds -= 1;
  if (remainingSeconds <= 0) {
    switchSession();
    return;
  }
  updateDisplay();
}

function startTimer() {
  if (isRunning) return;

  validateAndApplyInputs();
  saveSettingsToStorage();

  if (!isPaused) {
    remainingSeconds = (isFocusSession ? focusMinutes : breakMinutes) * 60;
  }
  isPaused = false;

  if (focusInput) focusInput.disabled = true;
  if (breakInput) breakInput.disabled = true;

  isRunning = true;
  if (startButton) {
    startButton.textContent = "Pause";
    startButton.setAttribute("aria-pressed", "true");
  }

  clearInterval(intervalId);
  intervalId = window.setInterval(tick, 1000);
  updateDisplay();
}

function pauseTimer() {
  if (!isRunning) return;

  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = true;

  if (focusInput) focusInput.disabled = false;
  if (breakInput) breakInput.disabled = false;

  if (startButton) {
    startButton.textContent = "Start";
    startButton.setAttribute("aria-pressed", "false");
  }

  updateDisplay();
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isPaused = false;
  isFocusSession = true;

  validateAndApplyInputs();
  remainingSeconds = focusMinutes * 60;

  if (focusInput) focusInput.disabled = false;
  if (breakInput) breakInput.disabled = false;

  if (startButton) {
    startButton.textContent = "Start";
    startButton.setAttribute("aria-pressed", "false");
  }

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

function init() {
  if (
    !appContainer ||
    !timerDisplay ||
    !sessionIndicator ||
    !focusInput ||
    !breakInput ||
    !startButton ||
    !resetButton
  ) {
    return;
  }

  loadSettingsFromStorage();
  loadStats();
  updateStatsUI();
  applySessionTheme();
  updateDisplay();

  startButton.addEventListener("click", () => {
    if (!isRunning) {
      startTimer();
    } else {
      pauseTimer();
    }
  });

  resetButton.addEventListener("click", resetTimer);

  const clearStatsButton = document.getElementById("clear-stats-button");
  if (clearStatsButton) {
    clearStatsButton.addEventListener("click", () => {
      stats.totalSessions = 0;
      stats.totalFocusMinutes = 0;
      saveStats();
      updateStatsUI();
    });
  }

  const onInputCommit = () => {
    if (!isRunning) {
      validateAndApplyInputs();
      updateDisplay();
    }
  };

  focusInput.addEventListener("blur", onInputCommit);
  focusInput.addEventListener("change", onInputCommit);
  breakInput.addEventListener("blur", onInputCommit);
  breakInput.addEventListener("change", onInputCommit);
}

document.addEventListener("DOMContentLoaded", init);
