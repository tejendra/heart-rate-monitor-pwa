import { useEffect, useRef, useState } from 'react';
import {
  WORKOUT_ACTIVITY_OPTIONS,
  type WorkoutActivityType,
  type WorkoutReport,
} from '../types';

const DESCRIPTION_SAVE_DEBOUNCE_MS = 500;

type ReportActivityFieldsProps = {
  report: WorkoutReport;
  onReportChange: (report: WorkoutReport) => void;
};

export function ReportActivityFields({
  report,
  onReportChange,
}: ReportActivityFieldsProps) {
  const [activityType, setActivityType] = useState<'' | WorkoutActivityType>(
    report.activityType ?? '',
  );
  const [description, setDescription] = useState(
    report.activityDescription ?? '',
  );
  const descriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    setActivityType(report.activityType ?? '');
    setDescription(report.activityDescription ?? '');
  }, [report.id]);

  useEffect(() => {
    return () => {
      if (descriptionDebounceRef.current !== null) {
        clearTimeout(descriptionDebounceRef.current);
      }
    };
  }, []);

  function publish(patch: {
    activityType?: WorkoutActivityType;
    activityDescription?: string;
  }) {
    const next: WorkoutReport = { ...report, ...patch };
    if (!next.activityType) {
      delete next.activityType;
    }
    if (!next.activityDescription?.trim()) {
      delete next.activityDescription;
    } else {
      next.activityDescription = next.activityDescription.trim();
    }
    onReportChange(next);
  }

  function handleTypeChange(value: string) {
    const nextType = value as '' | WorkoutActivityType;
    setActivityType(nextType);
    publish({
      activityType: nextType || undefined,
      activityDescription: description,
    });
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);

    if (descriptionDebounceRef.current !== null) {
      clearTimeout(descriptionDebounceRef.current);
    }

    descriptionDebounceRef.current = setTimeout(() => {
      publish({
        activityType: activityType || undefined,
        activityDescription: value,
      });
    }, DESCRIPTION_SAVE_DEBOUNCE_MS);
  }

  return (
    <div className="card report-activity">
      <h3 className="report-activity__title">Activity</h3>

      <label className="form-field">
        <span className="form-field__label">Activity type</span>
        <select
          value={activityType}
          onChange={(event) => handleTypeChange(event.target.value)}
          aria-label="Activity type"
        >
          {WORKOUT_ACTIVITY_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field report-activity__description-field">
        <span className="form-field__label">Description</span>
        <textarea
          className="report-activity__description"
          rows={4}
          value={description}
          placeholder="How did the workout feel? Notes on pace, terrain, intervals..."
          aria-label="Activity description"
          onChange={(event) => handleDescriptionChange(event.target.value)}
        />
      </label>
    </div>
  );
}