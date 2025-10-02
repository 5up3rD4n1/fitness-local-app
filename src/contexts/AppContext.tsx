import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AppState,
  WorkoutSession,
  SetProgress,
  Routine,
  Exercise,
  UserSettings,
  Screen,
} from '../types';
import { LocalStorageService } from '../utils/localStorage';
import workoutData from '../data/workoutData.json';

interface AppContextType extends AppState {
  routines: Routine[];
  exercises: Exercise[];
  currentScreen: Screen;
  startWorkout: (_routineId: string) => void;
  beginWorkoutTimer: () => void;
  completeSet: (_exerciseId: string, _setNumber: number) => void;
  uncompleteSet: (_exerciseId: string, _setNumber: number) => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  selectExercise: (_index: number) => void;
  updateSettings: (_settings: Partial<UserSettings>) => void;
  navigateTo: (_screen: Screen) => void;
  isLoading: boolean;
}

type AppAction =
  | { type: 'INITIALIZE'; payload: Partial<AppState> }
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

const initialState: AppState & { isLoading: boolean; currentScreen: Screen } = {
  currentRoutine: null,
  currentExerciseIndex: 0,
  currentSession: null,
  workoutHistory: [],
  settings: LocalStorageService.getDefaultSettings(),
  isLoading: true,
  currentScreen: 'home',
};

function appReducer(state: typeof initialState, action: AppAction): typeof initialState {
  switch (action.type) {
    case 'INITIALIZE': {
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    }

    case 'START_WORKOUT': {
      const routine = workoutData.routines.find((r) => r.id === action.payload.routineId);
      if (!routine) return state;

      const session: WorkoutSession = {
        id: uuidv4(),
        routineId: routine.id,
        date: new Date(),
        startedAt: undefined, // Don't start timing yet
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

      const updatedSession = {
        ...state.currentSession,
        startedAt: new Date(),
      };

      LocalStorageService.saveCurrentSession(updatedSession);

      return {
        ...state,
        currentSession: updatedSession,
      };
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
          (p) => !(p.exerciseId === action.payload.exerciseId && p.setNumber === action.payload.setNumber)
        ),
        newProgress,
      ];

      const updatedSession = {
        ...state.currentSession,
        setsProgress: updatedSetsProgress,
      };

      LocalStorageService.saveCurrentSession(updatedSession);

      return {
        ...state,
        currentSession: updatedSession,
      };
    }

    case 'UNCOMPLETE_SET': {
      if (!state.currentSession) return state;

      const updatedSetsProgress = state.currentSession.setsProgress.filter(
        (p) => !(p.exerciseId === action.payload.exerciseId && p.setNumber === action.payload.setNumber)
      );

      const updatedSession = {
        ...state.currentSession,
        setsProgress: updatedSetsProgress,
      };

      LocalStorageService.saveCurrentSession(updatedSession);

      return {
        ...state,
        currentSession: updatedSession,
      };
    }

    case 'COMPLETE_WORKOUT': {
      if (!state.currentSession) return state;

      const completedSession = {
        ...state.currentSession,
        completedAt: new Date(),
        completed: true,
        duration: Date.now() - new Date(state.currentSession.startedAt || Date.now()).getTime(),
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

    case 'CANCEL_WORKOUT': {
      LocalStorageService.saveCurrentSession(null);

      return {
        ...state,
        currentSession: null,
        currentRoutine: null,
        currentExerciseIndex: 0,
        currentScreen: 'home',
      };
    }

    case 'NEXT_EXERCISE': {
      if (!state.currentRoutine) return state;
      const nextIndex = Math.min(
        state.currentExerciseIndex + 1,
        state.currentRoutine.exercises.length - 1
      );
      return {
        ...state,
        currentExerciseIndex: nextIndex,
      };
    }

    case 'PREVIOUS_EXERCISE': {
      const prevIndex = Math.max(state.currentExerciseIndex - 1, 0);
      return {
        ...state,
        currentExerciseIndex: prevIndex,
      };
    }

    case 'SELECT_EXERCISE': {
      return {
        ...state,
        currentExerciseIndex: action.payload.index,
      };
    }

    case 'UPDATE_SETTINGS': {
      const updatedSettings = {
        ...state.settings,
        ...action.payload,
      };

      LocalStorageService.saveSettings(updatedSettings);

      return {
        ...state,
        settings: updatedSettings,
      };
    }

    case 'NAVIGATE': {
      return {
        ...state,
        currentScreen: action.payload,
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const currentSession = LocalStorageService.getCurrentSession();
      const workoutHistory = LocalStorageService.getWorkoutHistory();
      const settings = LocalStorageService.getSettings();
      const savedState = LocalStorageService.getAppState();

      dispatch({
        type: 'INITIALIZE',
        payload: {
          currentSession,
          workoutHistory,
          settings,
          ...(savedState || {}),
        },
      });
    };

    // Simulate loading delay
    setTimeout(loadData, 100);
  }, []);

  // Save app state on change
  useEffect(() => {
    if (!state.isLoading) {
      LocalStorageService.saveAppState({
        currentRoutine: state.currentRoutine,
        currentExerciseIndex: state.currentExerciseIndex,
      });
    }
  }, [state.currentRoutine, state.currentExerciseIndex, state.isLoading]);

  const value: AppContextType = {
    ...state,
    routines: workoutData.routines as Routine[],
    exercises: workoutData.exercises as Exercise[],
    currentScreen: state.currentScreen,

    startWorkout: (routineId: string) => {
      dispatch({ type: 'START_WORKOUT', payload: { routineId } });
    },

    beginWorkoutTimer: () => {
      dispatch({ type: 'BEGIN_WORKOUT_TIMER' });
    },

    completeSet: (exerciseId: string, setNumber: number) => {
      dispatch({ type: 'COMPLETE_SET', payload: { exerciseId, setNumber } });
    },

    uncompleteSet: (exerciseId: string, setNumber: number) => {
      dispatch({ type: 'UNCOMPLETE_SET', payload: { exerciseId, setNumber } });
    },

    completeWorkout: () => {
      dispatch({ type: 'COMPLETE_WORKOUT' });
    },

    cancelWorkout: () => {
      dispatch({ type: 'CANCEL_WORKOUT' });
    },

    nextExercise: () => {
      dispatch({ type: 'NEXT_EXERCISE' });
    },

    previousExercise: () => {
      dispatch({ type: 'PREVIOUS_EXERCISE' });
    },

    selectExercise: (index: number) => {
      dispatch({ type: 'SELECT_EXERCISE', payload: { index } });
    },

    updateSettings: (settings: Partial<UserSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    },

    navigateTo: (screen: Screen) => {
      dispatch({ type: 'NAVIGATE', payload: screen });
    },
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