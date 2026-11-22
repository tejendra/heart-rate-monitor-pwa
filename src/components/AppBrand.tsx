import { APP_NAME, APP_TAGLINE } from '../branding';

function BrandMark() {
  return (
    <svg
      className="app-brand__mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="app-brand__ring" cx="16" cy="16" r="14" />
      <path
        className="app-brand__pulse"
        d="M6 17h4.5l2.2-5.5 3.6 11 2.8-7.5H26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppBrand() {
  const [lead, tail] = splitBrandName(APP_NAME);

  return (
    <div className="app-brand">
      <BrandMark />
      <div className="app-brand__text">
        <h1 className="app-title">
          {lead}
          <span className="app-title__accent">{tail}</span>
        </h1>
        <p className="app-subtitle">{APP_TAGLINE}</p>
      </div>
    </div>
  );
}

function splitBrandName(name: string): [string, string] {
  if (name.length <= 4) {
    return ['', name];
  }
  return [name.slice(0, 4), name.slice(4)];
}