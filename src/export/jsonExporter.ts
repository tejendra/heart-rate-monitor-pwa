import type { WorkoutExport, WorkoutReport } from '../types';

export function createWorkoutExport(report: WorkoutReport): WorkoutExport {
  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    report,
  };
}

export function getWorkoutExportFilename(report: WorkoutReport): string {
  const date = report.startedAt.slice(0, 10);
  return `workout-${report.id}-${date}.json`;
}

export function downloadWorkoutReport(report: WorkoutReport): void {
  const payload = createWorkoutExport(report);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = getWorkoutExportFilename(report);
  anchor.click();
  URL.revokeObjectURL(url);
}
