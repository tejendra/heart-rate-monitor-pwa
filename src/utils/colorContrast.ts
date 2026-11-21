function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) {
    return [15, 20, 25];
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const channels = parseHexColor(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  const [red, green, blue] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

const LIGHT_FG = '#ffffff';
const DARK_FG = '#0f1419';

function contrastRatio(backgroundLuminance: number, foregroundLuminance: number) {
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface WorkoutZoneForeground {
  fg: string;
  fgMuted: string;
  gradientHighlight: string;
}

export function getWorkoutZoneForeground(background: string): WorkoutZoneForeground {
  const backgroundLuminance = relativeLuminance(background);
  const contrastWithLight = contrastRatio(
    backgroundLuminance,
    relativeLuminance(LIGHT_FG),
  );
  const contrastWithDark = contrastRatio(
    backgroundLuminance,
    relativeLuminance(DARK_FG),
  );
  const useLightText = contrastWithLight >= contrastWithDark;

  if (useLightText) {
    return {
      fg: '#ffffff',
      fgMuted: 'rgba(255, 255, 255, 0.82)',
      gradientHighlight: `color-mix(in srgb, ${background} 70%, #fff 30%)`,
    };
  }

  return {
    fg: DARK_FG,
    fgMuted: 'rgba(15, 20, 25, 0.78)',
    gradientHighlight: `color-mix(in srgb, ${background} 88%, #000 12%)`,
  };
}