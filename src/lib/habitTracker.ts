const STORAGE_KEY = "ride_habits";

export interface HabitEntry {
  time: string;        // HH:MM
  direction: "to-office" | "to-home";
  destination: string;
  action: "offered" | "booked";
  date: string;        // YYYY-MM-DD
}

interface StoredHabits {
  entries: HabitEntry[];
}

function load(): StoredHabits {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    return JSON.parse(raw);
  } catch {
    return { entries: [] };
  }
}

function save(habits: StoredHabits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

/** Record a ride action. Keeps only last 60 entries to stay lightweight. */
export function recordHabit(entry: HabitEntry) {
  const habits = load();
  habits.entries.push(entry);
  // Keep only the latest 60
  if (habits.entries.length > 60) {
    habits.entries = habits.entries.slice(-60);
  }
  save(habits);
}

export interface FrequentPattern {
  time: string;
  direction: "to-office" | "to-home";
  destination: string;
  action: "offered" | "booked";
  count: number;
}

/** Detect patterns where the same time appears ≥ 2 times. */
export function getFrequentPatterns(): FrequentPattern[] {
  const habits = load();
  // Group by time+direction+action
  const groups = new Map<string, { dest: string; count: number; direction: "to-office" | "to-home"; action: "offered" | "booked" }>();

  for (const e of habits.entries) {
    const key = `${e.time}|${e.direction}|${e.action}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, { dest: e.destination, count: 1, direction: e.direction, action: e.action });
    }
  }

  const patterns: FrequentPattern[] = [];
  for (const [key, val] of groups) {
    if (val.count >= 2) {
      const time = key.split("|")[0];
      patterns.push({
        time,
        direction: val.direction,
        destination: val.dest,
        action: val.action,
        count: val.count,
      });
    }
  }

  return patterns;
}

/** Delete all entries matching a specific pattern (time+direction+action). */
export function deletePattern(time: string, direction: string, action: string) {
  const habits = load();
  habits.entries = habits.entries.filter(
    (e) => !(e.time === time && e.direction === direction && e.action === action)
  );
  save(habits);
}

/** Get suggestion if any pattern's time is ~30 min from now (25-35 min window). */
export function getActiveSuggestion(): FrequentPattern | null {
  const patterns = getFrequentPatterns();
  if (patterns.length === 0) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const p of patterns) {
    const [h, m] = p.time.split(":").map(Number);
    const patternMinutes = h * 60 + m;
    const diff = patternMinutes - nowMinutes;
    // Show banner when 25-35 min before the pattern time
    if (diff >= 25 && diff <= 35) {
      return p;
    }
  }

  return null;
}
