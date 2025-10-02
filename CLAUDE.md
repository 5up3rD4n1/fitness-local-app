# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React single-page fitness application that compiles to a single HTML file with localStorage for data persistence. No backend or authentication is required - anyone with the HTML file can use the app.

## Tech Stack

- **React** - Single page application framework
- **Tailwind CSS** - Utility-first CSS framework for styling
- **localStorage** - Client-side data persistence
- **YouTube API** - Exercise video previews
- **Build Tool** - Vite (recommended for single HTML output)

## Project Structure

```
fitness-app/
├── docs/
│   ├── spec.md           # Project specification
│   └── designs/          # HTML design mockups
│       ├── home.html
│       ├── workout.html
│       ├── exercise-details.html
│       └── calendar-tracking.html
├── src/                  # Source code (to be created)
│   ├── components/       # React components
│   ├── screens/         # Screen components
│   ├── utils/           # Utility functions
│   └── App.jsx          # Main application
└── public/              # Static assets
```

## Key Commands

```bash
# Run development server
npm run dev

# Build to single HTML file
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code with Prettier
npm run format

# Check code formatting
npm run check-format

# Convert CSV workout data to JSON (if needed)
npm run convert-data
```

## Architecture

### Core Features
1. **Workout Management**: Display daily workouts with exercises as accordions
2. **Exercise Tracking**: Track sets, reps, and completion status
3. **Timer System**: Rest timers and exercise timers with countdown
4. **Video Integration**: YouTube video previews for exercise demonstrations
5. **Calendar Tracking**: Schedule and track workout sessions
6. **Progress Monitoring**: Track workout frequency and progress over time

### Data Structure (localStorage)
```javascript
{
  workouts: [
    {
      id: string,
      date: Date,
      name: string,
      exercises: [
        {
          id: string,
          name: string,
          sets: number,
          reps: number,
          duration: number,
          videoUrl: string,
          completed: boolean
        }
      ]
    }
  ],
  progress: {
    completedWorkouts: [],
    streaks: {}
  },
  settings: {
    restTimer: number,
    exerciseTimer: number
  }
}
```

### Screen Components
1. **Home Screen**: Today's workout, upcoming sessions, mini calendar, progress tracker
2. **Workout Screen**: Exercise list with accordion UI, one active exercise at a time
3. **Exercise Details**: Video preview, set tracking, timer controls
4. **Calendar Screen**: Monthly view with workout scheduling

### Design System
- **Colors**:
  - Primary bg: `#122118`
  - Secondary bg: `#1b3124`
  - Borders: `#264532`, `#366348`
  - Accent: `#38e07b`
  - Text: White (primary), `#96c5a9` (secondary)
- **Typography**: Lexend (headings), Noto Sans (body)
- **Layout**: Mobile-first responsive design

## Build Configuration for Single HTML

To compile to a single HTML file, use vite-plugin-singlefile:

```bash
npm install -D vite-plugin-singlefile
```

Configure vite.config.js:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000
  }
})
```

## Development Guidelines

1. **Component Structure**: Use functional components with hooks
2. **State Management**: Use React Context for global state (workouts, settings)
3. **Data Persistence**: Save to localStorage on every state change
4. **Responsive Design**: Mobile-first approach using Tailwind breakpoints
5. **Accessibility**: Ensure ARIA labels for interactive elements
6. **Performance**: Lazy load YouTube videos, optimize re-renders

## Testing Approach

When testing is implemented:
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Important Implementation Notes

1. **Accordion Behavior**: Only one exercise should be expanded at a time
2. **Exercise Completion**: Collapsed accordion items show checkmark if completed
3. **Timer Functionality**: Implement both rest timer and exercise timer with audio alerts
4. **YouTube Integration**: Use iframe API for video previews, ensure lazy loading
5. **Offline Support**: All functionality must work offline after initial load
6. **Single File Output**: Final build must be a single HTML file with all assets inlined