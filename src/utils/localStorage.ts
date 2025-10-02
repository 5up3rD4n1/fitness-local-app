import { WorkoutSession, UserSettings, AppState } from '../types';

const STORAGE_KEYS = {
  WORKOUT_HISTORY: 'fitness_app_workout_history',
  CURRENT_SESSION: 'fitness_app_current_session',
  USER_SETTINGS: 'fitness_app_user_settings',
  APP_STATE: 'fitness_app_state',
} as const;

export class LocalStorageService {
  private static isClient = typeof window !== 'undefined';

  private static safeJsonParse<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      console.error('Failed to parse JSON from localStorage');
      return defaultValue;
    }
  }

  private static safeJsonStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      console.error('Failed to stringify value for localStorage');
      return '{}';
    }
  }

  // Workout History
  static getWorkoutHistory(): WorkoutSession[] {
    if (!this.isClient) return [];
    const data = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
    return this.safeJsonParse(data, []);
  }

  static saveWorkoutHistory(sessions: WorkoutSession[]): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, this.safeJsonStringify(sessions));
  }

  static addWorkoutSession(session: WorkoutSession): void {
    const history = this.getWorkoutHistory();
    history.push(session);
    this.saveWorkoutHistory(history);
  }

  static deleteWorkoutSession(sessionId: string): void {
    const history = this.getWorkoutHistory();
    const filteredHistory = history.filter((session) => session.id !== sessionId);
    this.saveWorkoutHistory(filteredHistory);
  }

  // Current Session
  static getCurrentSession(): WorkoutSession | null {
    if (!this.isClient) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return this.safeJsonParse(data, null);
  }

  static saveCurrentSession(session: WorkoutSession | null): void {
    if (!this.isClient) return;
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, this.safeJsonStringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  }

  // User Settings
  static getSettings(): UserSettings {
    if (!this.isClient) return this.getDefaultSettings();
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return this.safeJsonParse(data, this.getDefaultSettings());
  }

  static saveSettings(settings: UserSettings): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, this.safeJsonStringify(settings));
  }

  static getDefaultSettings(): UserSettings {
    return {
      defaultRestTimer: 60, // 60 seconds
      defaultExerciseTimer: 30, // 30 seconds
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  // App State
  static getAppState(): Partial<AppState> | null {
    if (!this.isClient) return null;
    const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    return this.safeJsonParse(data, null);
  }

  static saveAppState(state: Partial<AppState>): void {
    if (!this.isClient) return;
    localStorage.setItem(STORAGE_KEYS.APP_STATE, this.safeJsonStringify(state));
  }

  // Clear all data
  static clearAll(): void {
    if (!this.isClient) return;
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  // Get stats
  static getStats() {
    const history = this.getWorkoutHistory();
    const completedWorkouts = history.filter((s) => s.completed);
    const totalDuration = completedWorkouts.reduce((acc, s) => acc + (s.duration || 0), 0);

    // Calculate streaks
    const sortedWorkouts = completedWorkouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    if (sortedWorkouts.length > 0) {
      sortedWorkouts.forEach((workout) => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          currentStreak = 1;
          maxStreak = 1;
        } else {
          const dayDiff = Math.floor(
            (lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else if (dayDiff > 1) {
            currentStreak = 1;
          }
        }
        lastDate = workoutDate;
      });
    }

    // Check if streak is still active (last workout was today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastDate) {
      const daysSinceLastWorkout = Math.floor(
        (today.getTime() - (lastDate as Date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastWorkout > 1) {
        currentStreak = 0;
      }
    }

    return {
      totalWorkouts: completedWorkouts.length,
      totalDuration,
      currentStreak,
      maxStreak,
      averageDuration: completedWorkouts.length > 0
        ? totalDuration / completedWorkouts.length
        : 0,
      lastWorkoutDate: sortedWorkouts[0]?.date || null,
    };
  }
}