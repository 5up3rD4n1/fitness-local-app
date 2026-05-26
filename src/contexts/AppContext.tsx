import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AppState,
  WorkoutSession,
  SetProgress,
  Routine,
  Exercise,
  Program,
  User,
  UserSummary,
  UserSettings,
  Screen,
} from '../types';
import { LocalStorageService } from '../utils/localStorage';
import workoutData from '../data/workoutData.json';

const PROGRAMS = workoutData.programs as Program[];
const ALL_ROUTINES: Routine[] = PROGRAMS.flatMap((p) => p.routines);
const findRoutine = (routineId: string): Routine | undefined =>
  ALL_ROUTINES.find((r) => r.id === routineId);

interface AppContextType extends AppState {
  // Catalog
  programs: Program[];
  currentProgram: Program | null;
  routines: Routine[]; // active program's routines
  exercises: Exercise[]; // active program's exercises
  allRoutines: Routine[]; // every program's routines (history resolution)
  currentScreen: Screen;
  isLoading: boolean;
  // Auth
  // eslint-disable-next-line no-unused-vars
  login: (username: string, password: string) => Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  listUsers: () => UserSummary[];
  // Programs
  // eslint-disable-next-line no-unused-vars
  setActiveProgram: (programId: string) => void;
  // Workout
  // eslint-disable-next-line no-unused-vars
  viewWorkout: (routineId: string) => void;
  // eslint-disable-next-line no-unused-vars
  startWorkout: (routineId: string) => void;
  beginWorkoutTimer: () => void;
  // eslint-disable-next-line no-unused-vars
  completeSet: (exerciseId: string, setNumber: number) => void;
  // eslint-disable-next-line no-unused-vars
  uncompleteSet: (exerciseId: string, setNumber: number) => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  // eslint-disable-next-line no-unused-vars
  selectExercise: (index: number) => void;
  // eslint-disable-next-line no-unused-vars
  updateSettings: (settings: Partial<UserSettings>) => void;
  // eslint-disable-next-line no-unused-vars
  navigateTo: (screen: Screen) => void;
}

type LoadedState = Partial<AppState>;

type AppAction =
  | { type: 'INITIALIZE'; payload: LoadedState & { currentScreen: Screen } }
  | { type: 'LOGIN'; payload: { user: User; data: LoadedState; screen: Screen } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ACTIVE_PROGRAM'; payload: string }
  | { type: 'VIEW_WORKOUT'; payload: { routineId: string } }
  | { type: 'START_WORKOUT'; payload: { routineId: string } }
  | { type: 'BEGIN_WORKOUT_TIMER' }
  | { type: 'COMPLETE_SET'; payload: { exerciseId: string; setNumber: number } }
  | { type: 'UNCOMPLETE_SET'; payload: { exerciseId: string; setNumber: number } }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'CANCEL_WORKOUT' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREVIOUS_EXERCISE' }
  | { type: 'SELECT_EXERCISE'; payload: { index: number } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'NAVIGATE'; payload: Screen }
  | { type: 'SET_LOADING'; payload: boolean };

type State = AppState & { isLoading: boolean; currentScreen: Screen };

const initialState: State = {
  currentRoutine: null,
  currentExerciseIndex: 0,
  currentSession: null,
  workoutHistory: [],
  settings: LocalStorageService.getDefaultSettings(),
  currentUser: null,
  activeProgramId: null,
  isLoading: true,
  currentScreen: 'login',
};

function appReducer(state: State, action: AppAction): State {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, ...action.payload, isLoading: false };

    case 'LOGIN':
      return {
        ...state,
        currentUser: action.payload.user,
        currentRoutine: null,
        currentExerciseIndex: 0,
        currentSession: null,
        workoutHistory: [],
        settings: LocalStorageService.getDefaultSettings(),
        activeProgramId: null,
        ...action.payload.data,
        currentScreen: action.payload.screen,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        settings: LocalStorageService.getDefaultSettings(),
      };

    case 'SET_ACTIVE_PROGRAM':
      return {
        ...state,
        activeProgramId: action.payload,
        currentRoutine: null,
        currentExerciseIndex: 0,
        currentScreen: 'home',
      };

    case 'VIEW_WORKOUT': {
      const routine = findRoutine(action.payload.routineId);
      if (!routine) return state;
      return {
        ...state,
        currentRoutine: routine,
        currentExerciseIndex: 0,
        currentScreen: 'workout',
      };
    }

    case 'START_WORKOUT': {
      const routine = findRoutine(action.payload.routineId);
      if (!routine) return state;
      const session: WorkoutSession = {
        id: uuidv4(),
        programId: routine.programId,
        routineId: routine.id,
        date: new Date(),
        startedAt: undefined,
        completed: false,
        setsProgress: [],
      };
      LocalStorageService.saveCurrentSession(session);
      return {
        ...state,
        currentRoutine: routine,
        currentExerciseIndex: 0,
        currentSession: session,
        currentScreen: 'workout',
      };
    }

    case 'BEGIN_WORKOUT_TIMER': {
      if (!state.currentSession) return state;
      const updatedSession = { ...state.currentSession, startedAt: new Date() };
      LocalStorageService.saveCurrentSession(updatedSession);
      return { ...state, currentSession: updatedSession };
    }

    case 'COMPLETE_SET': {
      if (!state.currentSession) return state;
      const newProgress: SetProgress = {
        exerciseId: action.payload.exerciseId,
        setNumber: action.payload.setNumber,
        completed: true,
        completedAt: new Date(),
      };
      const updatedSetsProgress = [
        ...state.currentSession.setsProgress.filter(
          (p) =>
            !(
              p.exerciseId === action.payload.exerciseId && p.setNumber === action.payload.setNumber
            )
        ),
        newProgress,
      ];
      const updatedSession = {
        ...state.currentSession,
        setsProgress: updatedSetsProgress,
        startedAt: state.currentSession.startedAt || new Date(),
      };
      LocalStorageService.saveCurrentSession(updatedSession);
      return { ...state, currentSession: updatedSession };
    }

    case 'UNCOMPLETE_SET': {
      if (!state.currentSession) return state;
      const updatedSetsProgress = state.currentSession.setsProgress.filter(
        (p) =>
          !(p.exerciseId === action.payload.exerciseId && p.setNumber === action.payload.setNumber)
      );
      const updatedSession = { ...state.currentSession, setsProgress: updatedSetsProgress };
      LocalStorageService.saveCurrentSession(updatedSession);
      return { ...state, currentSession: updatedSession };
    }

    case 'COMPLETE_WORKOUT': {
      if (!state.currentSession) return state;
      const startedAt = state.currentSession.startedAt
        ? new Date(state.currentSession.startedAt).getTime()
        : Date.now() - 1000;
      const completedAt = Date.now();
      const duration = Math.max(0, completedAt - startedAt);
      const completedSession = {
        ...state.currentSession,
        completedAt: new Date(),
        completed: true,
        duration,
      };
      LocalStorageService.addWorkoutSession(completedSession);
      LocalStorageService.saveCurrentSession(null);
      return {
        ...state,
        currentSession: null,
        currentRoutine: null,
        currentExerciseIndex: 0,
        workoutHistory: [...state.workoutHistory, completedSession],
        currentScreen: 'home',
      };
    }

    case 'CANCEL_WORKOUT':
      LocalStorageService.saveCurrentSession(null);
      return {
        ...state,
        currentSession: null,
        currentRoutine: null,
        currentExerciseIndex: 0,
        currentScreen: 'home',
      };

    case 'NEXT_EXERCISE': {
      if (!state.currentRoutine) return state;
      const nextIndex = Math.min(
        state.currentExerciseIndex + 1,
        state.currentRoutine.exercises.length - 1
      );
      return { ...state, currentExerciseIndex: nextIndex };
    }

    case 'PREVIOUS_EXERCISE':
      return { ...state, currentExerciseIndex: Math.max(state.currentExerciseIndex - 1, 0) };

    case 'SELECT_EXERCISE':
      return { ...state, currentExerciseIndex: action.payload.index };

    case 'UPDATE_SETTINGS': {
      const updatedSettings = { ...state.settings, ...action.payload };
      LocalStorageService.saveSettings(updatedSettings);
      return { ...state, settings: updatedSettings };
    }

    case 'NAVIGATE':
      return { ...state, currentScreen: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Read the active user's persisted slice (call after setCurrentUser). */
function loadUserState(): LoadedState {
  return {
    currentSession: LocalStorageService.getCurrentSession(),
    workoutHistory: LocalStorageService.getWorkoutHistory(),
    settings: LocalStorageService.getSettings(),
    activeProgramId: LocalStorageService.getActiveProgramId(),
    ...(LocalStorageService.getAppState() || {}),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Mount: migrate schema, then resume the last logged-in user (if any).
  useEffect(() => {
    const loadData = () => {
      LocalStorageService.checkAndMigrateSchema();
      const userId = LocalStorageService.getCurrentUserId();
      const user = userId ? LocalStorageService.getUserById(userId) : null;

      if (user) {
        LocalStorageService.setCurrentUser(user.id);
        const data = loadUserState();
        dispatch({
          type: 'INITIALIZE',
          payload: {
            currentUser: user,
            ...data,
            currentScreen: data.activeProgramId ? 'home' : 'programs',
          },
        });
      } else {
        LocalStorageService.setCurrentUser(null);
        dispatch({ type: 'INITIALIZE', payload: { currentUser: null, currentScreen: 'login' } });
      }
    };
    setTimeout(loadData, 100);
  }, []);

  // Persist lightweight nav state (active routine + index) for the current user.
  useEffect(() => {
    if (!state.isLoading && state.currentUser) {
      LocalStorageService.saveAppState({
        currentRoutine: state.currentRoutine,
        currentExerciseIndex: state.currentExerciseIndex,
      });
    }
  }, [state.currentRoutine, state.currentExerciseIndex, state.isLoading, state.currentUser]);

  const currentProgram = PROGRAMS.find((p) => p.id === state.activeProgramId) ?? null;

  const value: AppContextType = {
    ...state,
    programs: PROGRAMS,
    currentProgram,
    routines: currentProgram?.routines ?? [],
    exercises: currentProgram?.exercises ?? [],
    allRoutines: ALL_ROUTINES,
    currentScreen: state.currentScreen,

    login: async (username, password) => {
      const user = await LocalStorageService.verifyLogin(username, password);
      if (!user) return false;
      LocalStorageService.setCurrentUser(user.id);
      const data = loadUserState();
      dispatch({
        type: 'LOGIN',
        payload: { user, data, screen: data.activeProgramId ? 'home' : 'programs' },
      });
      return true;
    },

    register: async (username, password) => {
      const user = await LocalStorageService.register(username, password);
      LocalStorageService.setCurrentUser(user.id);
      dispatch({ type: 'LOGIN', payload: { user, data: loadUserState(), screen: 'programs' } });
    },

    logout: () => {
      LocalStorageService.logout();
      dispatch({ type: 'LOGOUT' });
    },

    listUsers: () => LocalStorageService.listUsers(),

    setActiveProgram: (programId) => {
      LocalStorageService.setActiveProgramId(programId);
      dispatch({ type: 'SET_ACTIVE_PROGRAM', payload: programId });
    },

    viewWorkout: (routineId) => dispatch({ type: 'VIEW_WORKOUT', payload: { routineId } }),
    startWorkout: (routineId) => dispatch({ type: 'START_WORKOUT', payload: { routineId } }),
    beginWorkoutTimer: () => dispatch({ type: 'BEGIN_WORKOUT_TIMER' }),
    completeSet: (exerciseId, setNumber) =>
      dispatch({ type: 'COMPLETE_SET', payload: { exerciseId, setNumber } }),
    uncompleteSet: (exerciseId, setNumber) =>
      dispatch({ type: 'UNCOMPLETE_SET', payload: { exerciseId, setNumber } }),
    completeWorkout: () => dispatch({ type: 'COMPLETE_WORKOUT' }),
    cancelWorkout: () => dispatch({ type: 'CANCEL_WORKOUT' }),
    nextExercise: () => dispatch({ type: 'NEXT_EXERCISE' }),
    previousExercise: () => dispatch({ type: 'PREVIOUS_EXERCISE' }),
    selectExercise: (index) => dispatch({ type: 'SELECT_EXERCISE', payload: { index } }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    navigateTo: (screen) => dispatch({ type: 'NAVIGATE', payload: screen }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
