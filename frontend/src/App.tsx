import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { CalendarPage } from './pages/CalendarPage';
import { BacktestPage } from './pages/BacktestPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="backtest" element={<BacktestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
