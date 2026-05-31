export type ExerciseSection = 'activation' | 'main' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  programId: string; // owning program
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  videoUrl: string;
  day: number;
  section: ExerciseSection;
  equipment: string;
  description: string; // movement cues (Spanish)
  safetyNotes: string; // safety notes (Spanish)
  /** Time-based moves (planks, carries, ropes): hold/work seconds. Drives the duration Timer. */
  durationSeconds?: number;
  /** Display-only effort label, e.g. "30% 1RM", "65% FCMax", "RPE 9". */
  intensity?: string;
}

/**
 * A routine is an ordered list of blocks. A `single` block is one exercise run on its own;
 * a `circuit` block is a labeled group run for N rounds with a rest between rounds.
 * Circuit members carry `sets = rounds`, so round R == setNumber R in WorkoutSession.setsProgress.
 */
export type RoutineBlock =
  | { kind: 'single'; exerciseId: string }
  | {
      kind: 'circuit';
      id: string;
      label: string;
      rounds: number;
      restBetweenRounds: string;
      exerciseIds: string[];
    };

export interface Routine {
  id: string;
  programId: string; // owning program
  name: string;
  title: string; // Spanish day title, e.g. "DÍA 1 — GLÚTEO Y CADENA POSTERIOR"
  focus?: string; // Spanish focus / duration subtitle
  day: number;
  /** Canonical ordering (single | circuit). */
  blocks: RoutineBlock[];
  /** Derived flat projection of `blocks` (in order, circuits expanded). Exercise IDs. */
  exercises: string[];
}

export interface SetProgress {
  exerciseId: string;
  setNumber: number;
  completed: boolean;
  completedAt?: Date;
}

export interface WorkoutSession {
  id: string;
  programId: string;
  routineId: string;
  date: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  completed: boolean;
  setsProgress: SetProgress[];
}

export interface UserSettings {
  defaultRestTimer: number; // in seconds
  defaultExerciseTimer: number; // in seconds
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppState {
  currentRoutine: Routine | null;
  currentExerciseIndex: number;
  currentSession: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  settings: UserSettings;
  currentUser: User | null;
  activeProgramId: string | null;
}

export type Screen =
  | 'login'
  | 'home'
  | 'workout'
  | 'calendar'
  | 'progress'
  | 'programs'
  | 'program'
  | 'settings';

export interface NavigationState {
  currentScreen: Screen;
  previousScreen?: Screen;
}

/** A local account. Password is salted + SHA-256 hashed; this is a casual gate, not real security. */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

/** Non-secret user fields for the login picker. */
export interface UserSummary {
  id: string;
  username: string;
}

export interface ProgramMeta {
  id: string;
  name: string;
  description: string;
  safetyPrinciples: string[];
  recommendedEquipment: string[];
}

/** A training program: metadata + its routines + its exercises. Top of the hierarchy. */
export interface Program extends ProgramMeta {
  routines: Routine[];
  exercises: Exercise[];
}
