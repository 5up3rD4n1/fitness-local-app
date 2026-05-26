import { WorkoutSession, UserSettings, AppState, User, UserSummary } from '../types';

// Global (not per-user) keys.
const GLOBAL_KEYS = {
  USERS: 'fitness_app_users',
  CURRENT_USER: 'fitness_app_current_user',
} as const;

// Per-user data suffixes → key = `fitness_app_u_<userId>_<suffix>`.
const USER_SUFFIX = {
  WORKOUT_HISTORY: 'workout_history',
  CURRENT_SESSION: 'current_session',
  USER_SETTINGS: 'user_settings',
  APP_STATE: 'state',
  ACTIVE_PROGRAM: 'active_program',
} as const;

const KEY_PREFIX = 'fitness_app_';
// Kept OUTSIDE the wipe set so clearAll() never erases the version marker.
const SCHEMA_VERSION_KEY = 'fitness_app_schema_version';
// 3 = multi-user accounts + program hierarchy (prior single-user data is incompatible).
const CURRENT_SCHEMA_VERSION = 3;

export class LocalStorageService {
  private static isClient = typeof window !== 'undefined';
  /** The active account whose namespace all per-user reads/writes target. */
  private static currentUserId: string | null = null;

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

  // ---- Crypto (casual gate: salted SHA-256, NOT real security — localStorage is readable) ----
  private static async sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static genSalt(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async hashPassword(password: string, salt: string): Promise<string> {
    return this.sha256Hex(`${salt}:${password}`);
  }

  // ---- Users / accounts ----
  private static getUsers(): User[] {
    if (!this.isClient) return [];
    return this.safeJsonParse<User[]>(localStorage.getItem(GLOBAL_KEYS.USERS), []);
  }

  private static saveUsers(users: User[]): void {
    if (!this.isClient) return;
    localStorage.setItem(GLOBAL_KEYS.USERS, this.safeJsonStringify(users));
  }

  /** Non-secret list for the login picker. */
  static listUsers(): UserSummary[] {
    return this.getUsers().map((u) => ({ id: u.id, username: u.username }));
  }

  static getUserById(id: string): User | null {
    return this.getUsers().find((u) => u.id === id) ?? null;
  }

  static usernameExists(username: string): boolean {
    const norm = username.trim().toLowerCase();
    return this.getUsers().some((u) => u.username.toLowerCase() === norm);
  }

  /** Create a new account. Throws on empty/duplicate username. Does not log in. */
  static async register(username: string, password: string): Promise<User> {
    const name = username.trim();
    if (!name) throw new Error('El nombre de usuario es obligatorio.');
    if (password.length < 4) throw new Error('La contraseña debe tener al menos 4 caracteres.');
    if (this.usernameExists(name)) throw new Error('Ese nombre de usuario ya existe.');

    const salt = this.genSalt();
    const passwordHash = await this.hashPassword(password, salt);
    const user: User = {
      id: crypto.randomUUID(),
      username: name,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };
    this.saveUsers([...this.getUsers(), user]);
    return user;
  }

  /** Verify credentials; returns the user on success, null otherwise. */
  static async verifyLogin(username: string, password: string): Promise<User | null> {
    const norm = username.trim().toLowerCase();
    const user = this.getUsers().find((u) => u.username.toLowerCase() === norm);
    if (!user) return null;
    const hash = await this.hashPassword(password, user.salt);
    return hash === user.passwordHash ? user : null;
  }

  // ---- Session (which account is active) ----
  static setCurrentUser(userId: string | null): void {
    this.currentUserId = userId;
    if (!this.isClient) return;
    if (userId) localStorage.setItem(GLOBAL_KEYS.CURRENT_USER, userId);
    else localStorage.removeItem(GLOBAL_KEYS.CURRENT_USER);
  }

  static getCurrentUserId(): string | null {
    if (this.currentUserId) return this.currentUserId;
    if (!this.isClient) return null;
    const id = localStorage.getItem(GLOBAL_KEYS.CURRENT_USER);
    this.currentUserId = id;
    return id;
  }

  static logout(): void {
    this.setCurrentUser(null);
  }

  private static userKey(suffix: string): string | null {
    if (!this.currentUserId) return null;
    return `fitness_app_u_${this.currentUserId}_${suffix}`;
  }

  // ---- Active program (per user) ----
  static getActiveProgramId(): string | null {
    const key = this.userKey(USER_SUFFIX.ACTIVE_PROGRAM);
    if (!this.isClient || !key) return null;
    return localStorage.getItem(key);
  }

  static setActiveProgramId(programId: string | null): void {
    const key = this.userKey(USER_SUFFIX.ACTIVE_PROGRAM);
    if (!this.isClient || !key) return;
    if (programId) localStorage.setItem(key, programId);
    else localStorage.removeItem(key);
  }

  // ---- Workout history (per user) ----
  static getWorkoutHistory(): WorkoutSession[] {
    const key = this.userKey(USER_SUFFIX.WORKOUT_HISTORY);
    if (!this.isClient || !key) return [];
    return this.safeJsonParse(localStorage.getItem(key), []);
  }

  static saveWorkoutHistory(sessions: WorkoutSession[]): void {
    const key = this.userKey(USER_SUFFIX.WORKOUT_HISTORY);
    if (!this.isClient || !key) return;
    localStorage.setItem(key, this.safeJsonStringify(sessions));
  }

  static addWorkoutSession(session: WorkoutSession): void {
    this.saveWorkoutHistory([...this.getWorkoutHistory(), session]);
  }

  static deleteWorkoutSession(sessionId: string): void {
    this.saveWorkoutHistory(this.getWorkoutHistory().filter((s) => s.id !== sessionId));
  }

  // ---- Current session (per user) ----
  static getCurrentSession(): WorkoutSession | null {
    const key = this.userKey(USER_SUFFIX.CURRENT_SESSION);
    if (!this.isClient || !key) return null;
    return this.safeJsonParse(localStorage.getItem(key), null);
  }

  static saveCurrentSession(session: WorkoutSession | null): void {
    const key = this.userKey(USER_SUFFIX.CURRENT_SESSION);
    if (!this.isClient || !key) return;
    if (session) localStorage.setItem(key, this.safeJsonStringify(session));
    else localStorage.removeItem(key);
  }

  // ---- Settings (per user) ----
  static getSettings(): UserSettings {
    const key = this.userKey(USER_SUFFIX.USER_SETTINGS);
    if (!this.isClient || !key) return this.getDefaultSettings();
    return this.safeJsonParse(localStorage.getItem(key), this.getDefaultSettings());
  }

  static saveSettings(settings: UserSettings): void {
    const key = this.userKey(USER_SUFFIX.USER_SETTINGS);
    if (!this.isClient || !key) return;
    localStorage.setItem(key, this.safeJsonStringify(settings));
  }

  static getDefaultSettings(): UserSettings {
    return {
      defaultRestTimer: 60,
      defaultExerciseTimer: 30,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  // ---- App state (per user) ----
  static getAppState(): Partial<AppState> | null {
    const key = this.userKey(USER_SUFFIX.APP_STATE);
    if (!this.isClient || !key) return null;
    return this.safeJsonParse(localStorage.getItem(key), null);
  }

  static saveAppState(state: Partial<AppState>): void {
    const key = this.userKey(USER_SUFFIX.APP_STATE);
    if (!this.isClient || !key) return;
    localStorage.setItem(key, this.safeJsonStringify(state));
  }

  // ---- Maintenance ----
  /** Wipe every app key (users + all per-user namespaces) except the schema marker. */
  static clearAll(): void {
    if (!this.isClient) return;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX) && k !== SCHEMA_VERSION_KEY) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    this.currentUserId = null;
  }

  /** On schema-version mismatch, wipe stale data once (clean slate). */
  static checkAndMigrateSchema(): void {
    if (!this.isClient) return;
    const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
    const version = stored ? parseInt(stored, 10) : null;
    if (version !== CURRENT_SCHEMA_VERSION) {
      this.clearAll();
      localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    }
  }

  // ---- Stats (current user's history) ----
  static getStats() {
    const history = this.getWorkoutHistory();
    const completedWorkouts = history.filter((s) => s.completed);
    const totalDuration = completedWorkouts.reduce((acc, s) => acc + (s.duration || 0), 0);

    const sortedWorkouts = completedWorkouts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDate) {
      const daysSinceLastWorkout = Math.floor(
        (today.getTime() - (lastDate as Date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastWorkout > 1) currentStreak = 0;
    }

    return {
      totalWorkouts: completedWorkouts.length,
      totalDuration,
      currentStreak,
      maxStreak,
      averageDuration: completedWorkouts.length > 0 ? totalDuration / completedWorkouts.length : 0,
      lastWorkoutDate: sortedWorkouts[0]?.date || null,
    };
  }
}
