import { AppProvider, useApp } from './contexts/AppContext';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProgramsScreen from './screens/ProgramsScreen';
import ProgramScreen from './screens/ProgramScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Screen } from './types';

const HIDE_TABBAR: Screen[] = ['workout', 'programs', 'program', 'settings'];

function AppContent() {
  const { currentScreen, isLoading, currentUser } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Auth gate: no account active → login (full screen, no tab bar).
  if (!currentUser) {
    return (
      <div className="relative flex h-full w-full flex-col app-aurora overflow-hidden font-lexend text-[var(--color-text-primary)]">
        <div className="flex-1 overflow-y-auto">
          <LoginScreen />
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'workout':
        return <WorkoutScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'programs':
        return <ProgramsScreen />;
      case 'program':
        return <ProgramScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col app-aurora overflow-hidden font-lexend text-[var(--color-text-primary)]">
      <div className="flex-1 overflow-y-auto">{renderScreen()}</div>
      {!HIDE_TABBAR.includes(currentScreen) && <Navigation />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
