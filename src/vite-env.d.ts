/// <reference types="vite/client" />
/// <reference types="@types/web-bluetooth" />

interface ImportMetaEnv {
  readonly VITE_MOCK_HEART_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
