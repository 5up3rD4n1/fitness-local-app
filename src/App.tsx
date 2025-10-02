import { AppProvider, useApp } from './contexts/AppContext';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProgressScreen from './screens/ProgressScreen';

function AppContent() {
  const { currentScreen, isLoading } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
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
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-primary-bg text-white font-lexend overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {renderScreen()}
      </div>
      <Navigation />
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