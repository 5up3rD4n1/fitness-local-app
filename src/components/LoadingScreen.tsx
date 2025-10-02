import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-primary-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-border-primary border-t-accent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-accent"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Fitness App</h1>
          <p className="text-text-secondary">Loading your workout data...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;