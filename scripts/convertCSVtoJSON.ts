import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  videoUrl: string;
  day: number;
}

interface Routine {
  id: string;
  name: string;
  day: number;
  exercises: string[]; // Array of exercise IDs
}

interface WorkoutData {
  routines: Routine[];
  exercises: Exercise[];
}

function parseCSV(csvContent: string): WorkoutData {
  const lines = csvContent.split('\n');
  const exercises: Exercise[] = [];
  const routinesMap = new Map<number, { name: string; exerciseIds: string[] }>();

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line
    const parts = line.split(',');
    if (parts.length < 7) continue;

    const day = parseInt(parts[0]);
    const exerciseName = parts[1].trim();
    const sets = parts[2].trim();
    const reps = parts[3].trim();
    const restTime = parts[4].trim();
    // Skip empty column (index 5)
    const videoUrl = parts[6]?.trim() || '';

    if (!exerciseName || !day) continue;

    // Create exercise
    const exerciseId = uuidv4();
    const exercise: Exercise = {
      id: exerciseId,
      name: exerciseName,
      sets: isNaN(parseInt(sets)) ? 0 : parseInt(sets),
      reps: reps,
      restTime: restTime,
      videoUrl: videoUrl,
      day: day,
    };
    exercises.push(exercise);

    // Group by day for routines
    if (!routinesMap.has(day)) {
      const routineName = `Day ${day} Workout`;
      routinesMap.set(day, { name: routineName, exerciseIds: [] });
    }
    routinesMap.get(day)!.exerciseIds.push(exerciseId);
  }

  // Create routines
  const routines: Routine[] = Array.from(routinesMap.entries()).map(([day, data]) => ({
    id: uuidv4(),
    name: data.name,
    day: day,
    exercises: data.exerciseIds,
  }));

  // Add names based on day content
  if (routines[0]) routines[0].name = 'Day 1: Glutes & Legs';
  if (routines[1]) routines[1].name = 'Day 2: Back & Biceps';
  if (routines[2]) routines[2].name = 'Day 3: Legs & Glutes';
  if (routines[3]) routines[3].name = 'Day 4: Chest & Triceps';
  if (routines[4]) routines[4].name = 'Day 5: Shoulders & Abs';

  return { routines, exercises };
}

function main() {
  const csvPath = path.join(__dirname, '../docs/Rutina - Sheet1(1).csv');
  const outputPath = path.join(__dirname, '../src/data/workoutData.json');

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const workoutData = parseCSV(csvContent);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(workoutData, null, 2));

    console.log('✅ Successfully converted CSV to JSON');
    console.log(`📊 Created ${workoutData.routines.length} routines with ${workoutData.exercises.length} exercises`);
    console.log(`📁 Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error converting CSV:', error);
    process.exit(1);
  }
}

main();