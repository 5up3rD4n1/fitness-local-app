export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  videoUrl: string;
  day: number;
}

export interface Routine {
  id: string;
  name: string;
  day: number;
  exercises: string[]; // Array of exercise IDs
}

export interface SetProgress {
  exerciseId: string;
  setNumber: number;
  completed: boolean;
  completedAt?: Date;
}

export interface WorkoutSession {
  id: string;
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
}

export type Screen = 'home' | 'workout' | 'calendar' | 'progress';

export interface NavigationState {
  currentScreen: Screen;
  previousScreen?: Screen;
}