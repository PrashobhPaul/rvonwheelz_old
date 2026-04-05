const STORAGE_KEY = "ride_habits";

export interface HabitEntry {
  time: string;        // HH:MM
  direction: "to-office" | "to-home";
  destination: string; // "to" for going, "from" for returning
  from?: string;       // origin location
  action: "offered" | "booked";
  date: string;        // YYYY-MM-DD
  days?: string[];     // e.g. ["Mon","Tue","Wed"]
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
  if (habits.entries.length > 60) {
    habits.entries = habits.entries.slice(-60);
  }
  save(habits);
}

export interface FrequentPattern {
  time: string;
  direction: "to-office" | "to-home";
  from: string;
  to: string;
  action: "offered" | "booked";
  frequency: number;
  days: string[];
}

/** Detect patterns where the same time appears ≥ 2 times. */
export function getFrequentPatterns(): FrequentPattern[] {
  const habits = load();
  const groups = new Map<string, {
    from: string;
    to: string;
    count: number;
    direction: "to-office" | "to-home";
    action: "offered" | "booked";
    days: Set<string>;
  }>();

  for (const e of habits.entries) {
    const key = `${e.time}|${e.direction}|${e.action}`;
    const existing = groups.get(key);

    // Derive from/to based on direction
    const entryFrom = e.direction === "to-office" ? (e.from || "Raheja Vistas Elite, Nacharam") : e.destination;
    const entryTo = e.direction === "to-office" ? e.destination : "Raheja Vistas Elite, Nacharam";

    // Collect day-of-week from date
    const entryDays = e.days || [];

    if (existing) {
      existing.count++;
      entryDays.forEach((d) => existing.days.add(d));
    } else {
      groups.set(key, {
        from: entryFrom,
        to: entryTo,
        count: 1,
        direction: e.direction,
        action: e.action,
        days: new Set(entryDays),
      });
    }
  }

  const patterns: FrequentPattern[] = [];
  for (const [key, val] of groups) {
    if (val.count >= 2) {
      const time = key.split("|")[0];
      patterns.push({
        time,
        direction: val.direction,
        from: val.from,
        to: val.to,
        action: val.action,
        frequency: val.count,
        days: Array.from(val.days),
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
    if (diff >= 25 && diff <= 35) {
      return p;
    }
  }

  return null;
}
