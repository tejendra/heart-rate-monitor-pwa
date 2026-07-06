import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HeartRateProvider } from './context/HeartRateContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { WorkoutPage } from './pages/WorkoutPage';

export function App() {
  return (
    <HeartRateProvider>
      <WorkoutProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="report/:id?" element={<ReportPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkoutProvider>
    </HeartRateProvider>
  );
}
