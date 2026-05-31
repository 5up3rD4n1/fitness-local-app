import fs from 'fs';
import path from 'path';

type ExerciseSection = 'activation' | 'main' | 'core' | 'cardio';

interface Exercise {
  id: string;
  programId: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  videoUrl: string;
  day: number;
  section: ExerciseSection;
  equipment: string;
  description: string;
  safetyNotes: string;
  durationSeconds?: number;
  intensity?: string;
}

type RoutineBlock =
  | { kind: 'single'; exerciseId: string }
  | {
      kind: 'circuit';
      id: string;
      label: string;
      rounds: number;
      restBetweenRounds: string;
      exerciseIds: string[];
    };

interface Routine {
  id: string;
  programId: string;
  name: string;
  title: string;
  focus?: string;
  day: number;
  blocks: RoutineBlock[];
  exercises: string[];
}

interface ProgramMeta {
  id: string;
  name: string;
  description: string;
  safetyPrinciples: string[];
  recommendedEquipment: string[];
}

interface Program extends ProgramMeta {
  routines: Routine[];
  exercises: Exercise[];
}

interface WorkoutData {
  programs: Program[];
}

const PROGRAMS_DIR = path.join(__dirname, '../docs/programs');
const OUTPUT_PATH = path.join(__dirname, '../src/data/workoutData.json');

/** RFC4180-aware single-line parser (these CSVs have no embedded newlines). */
function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

/** Accent-stripping kebab slug for stable ids. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/** Parse a duration token like "40s", "30''", "30\"", "1min" → seconds, else null. */
function parseDuration(s: string): number | null {
  const t = s.trim().toLowerCase();
  let m = t.match(/^(\d+)\s*(?:s|seg|''|"|”|″)$/);
  if (m) return parseInt(m[1], 10);
  m = t.match(/^(\d+)\s*min$/);
  if (m) return parseInt(m[1], 10) * 60;
  return null;
}

/** Parse a `CIRCUIT,rounds=3,rest=90s,label=...` marker row. Returns null if not a circuit marker. */
function parseCircuitMarker(
  cols: string[]
): { rounds: number; rest: string; label: string } | null {
  if ((cols[0] || '').trim().toUpperCase() !== 'CIRCUIT') return null;
  const params: Record<string, string> = {};
  for (const cell of cols.slice(1)) {
    const m = cell.match(/^\s*(\w+)\s*=\s*(.*)$/);
    if (m) params[m[1].toLowerCase()] = m[2].trim();
  }
  return {
    rounds: parseInt(params.rounds || '3', 10) || 3,
    rest: params.rest || '60s',
    label: params.label || 'Circuito',
  };
}

function sectionFromHeader(s: string): ExerciseSection | null {
  const u = s.toUpperCase();
  if (/^ACTIVACI[ÓO]N/.test(u) || /^WARM[\s-]?UP/.test(u)) return 'activation';
  if (/^BLOQUE\s+PRINCIPAL/.test(u) || /^MAIN/.test(u)) return 'main';
  if (/^BLOQUE\s+CORE/.test(u) || /^CORE/.test(u)) return 'core';
  if (/^CARDIO/.test(u) || /^CONDITIONING/.test(u)) return 'cardio';
  return null;
}

/** Build one routine (+ its exercises) from a day CSV. IDs are prefixed with the program id. */
function convertFile(
  filePath: string,
  programId: string,
  day: number,
  videoMap: Record<string, string>
): { routine: Routine; exercises: Exercise[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const exercises: Exercise[] = [];
  const exerciseIds: string[] = [];
  const blocks: RoutineBlock[] = [];
  const seenLocal = new Set<string>();

  let title = `Día ${day}`;
  let focus: string | undefined;
  let currentSection: ExerciseSection = 'activation';
  let sawTitle = false;
  // Open circuit accumulator (null when not inside a CIRCUIT...ENDCIRCUIT span).
  let circuit: {
    id: string;
    label: string;
    rounds: number;
    restBetweenRounds: string;
    exerciseIds: string[];
  } | null = null;
  let circuitSeq = 0;

  const closeCircuit = () => {
    if (circuit && circuit.exerciseIds.length > 0) {
      blocks.push({ kind: 'circuit', ...circuit });
    }
    circuit = null;
  };

  for (const rawLine of lines) {
    const cols = parseCSVLine(rawLine);
    const c0 = (cols[0] || '').trim();
    if (!c0) continue;

    if (!sawTitle && /^(?:D[ÍI]A|DAY)\s+\d/i.test(c0)) {
      title = c0;
      sawTitle = true;
      continue;
    }
    if (/^(?:Enfoque|Focus)\s*:/i.test(c0)) {
      focus = c0.replace(/^(?:Enfoque|Focus):\s*/i, '');
      continue;
    }
    if (c0 === 'Ejercicio') continue;

    // Circuit markers
    if (c0.toUpperCase() === 'ENDCIRCUIT') {
      closeCircuit();
      continue;
    }
    const marker = parseCircuitMarker(cols);
    if (marker) {
      closeCircuit();
      circuitSeq += 1;
      circuit = {
        id: `${programId}-day-${day}-c${circuitSeq}`,
        label: marker.label,
        rounds: marker.rounds,
        restBetweenRounds: marker.rest,
        exerciseIds: [],
      };
      continue;
    }

    // Section header row (closes any open circuit)
    const sec = sectionFromHeader(c0);
    if (sec && (cols[1] || '').trim() === '') {
      closeCircuit();
      currentSection = sec;
      continue;
    }

    // Exercise row. Local id (for video lookup) then program-prefixed global id.
    const name = c0;
    let localId = `d${day}-${slugify(name)}`;
    if (seenLocal.has(localId)) {
      let k = 2;
      while (seenLocal.has(`${localId}-${k}`)) k++;
      localId = `${localId}-${k}`;
    }
    seenLocal.add(localId);
    const id = `${programId}-${localId}`;

    const repsRaw = (cols[2] || '').trim();
    const rest = (cols[3] || '').trim();
    const intensity = (cols[7] || '').trim();
    const dur = parseDuration(repsRaw);
    // Circuit members run for `rounds` rounds; standalone rows use their own sets column.
    const setsCol = parseInt((cols[1] || '').trim(), 10);
    const sets = circuit ? circuit.rounds : Number.isNaN(setsCol) ? 0 : setsCol;

    const exercise: Exercise = {
      id,
      programId,
      name,
      sets,
      reps: repsRaw,
      restTime: rest === '—' ? '' : rest,
      videoUrl: videoMap[localId] || videoMap[id] || '',
      day,
      section: currentSection,
      equipment: (cols[4] || '').trim(),
      description: (cols[5] || '').trim(),
      safetyNotes: (cols[6] || '').trim(),
    };
    if (dur != null) exercise.durationSeconds = dur;
    if (intensity) exercise.intensity = intensity;

    exercises.push(exercise);
    exerciseIds.push(id);
    if (circuit) {
      circuit.exerciseIds.push(id);
    } else {
      blocks.push({ kind: 'single', exerciseId: id });
    }
  }
  closeCircuit();

  const routine: Routine = {
    id: `${programId}-day-${day}`,
    programId,
    name: title,
    title,
    focus,
    day,
    blocks,
    exercises: exerciseIds,
  };
  return { routine, exercises };
}

/** Build one Program from docs/programs/<id>/ (program.json + routines/*.csv + videos.json). */
function convertProgram(dir: string): Program {
  const metaPath = path.join(dir, 'program.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Missing program.json in ${dir}`);
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as ProgramMeta;
  const programId = meta.id;

  let videoMap: Record<string, string> = {};
  const videosPath = path.join(dir, 'videos.json');
  if (fs.existsSync(videosPath)) {
    try {
      videoMap = JSON.parse(fs.readFileSync(videosPath, 'utf-8'));
    } catch {
      console.warn(`⚠️  Could not parse ${videosPath}; continuing without videos`);
    }
  }

  const routinesDir = path.join(dir, 'routines');
  const files = fs
    .readdirSync(routinesDir)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => {
      const m = f.match(/(?:D[IÍ]A|DAY)\s+(\d)/i);
      return { file: f, day: m ? parseInt(m[1], 10) : 0 };
    })
    .filter((x) => x.day > 0)
    .sort((a, b) => a.day - b.day);

  if (files.length === 0) {
    throw new Error(`No routine CSVs found in ${routinesDir}`);
  }

  const routines: Routine[] = [];
  const exercises: Exercise[] = [];
  for (const { file, day } of files) {
    const { routine, exercises: ex } = convertFile(
      path.join(routinesDir, file),
      programId,
      day,
      videoMap
    );
    routines.push(routine);
    exercises.push(...ex);
  }

  return { ...meta, routines, exercises };
}

function main() {
  if (!fs.existsSync(PROGRAMS_DIR)) {
    console.error('❌ No programs dir at', PROGRAMS_DIR);
    process.exit(1);
  }

  const programDirs = fs
    .readdirSync(PROGRAMS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(PROGRAMS_DIR, d.name))
    .sort();

  if (programDirs.length === 0) {
    console.error('❌ No program subfolders in', PROGRAMS_DIR);
    process.exit(1);
  }

  const programs: Program[] = programDirs.map(convertProgram);
  const data: WorkoutData = { programs };

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

  for (const p of programs) {
    const withVideo = p.exercises.filter((e) => e.videoUrl).length;
    console.log(
      `✅ ${p.id}: ${p.routines.length} routines, ${p.exercises.length} exercises, ${withVideo} with video`
    );
  }
  console.log(
    `📁 Output: ${OUTPUT_PATH} (${programs.length} program${programs.length > 1 ? 's' : ''})`
  );
}

main();
