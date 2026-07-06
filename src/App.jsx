import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';

// App pages
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import LiveGames from '@/pages/LiveGames';
import SpectatorView from '@/pages/SpectatorView';
import Schedule from '@/pages/Schedule';
import Standings from '@/pages/Standings';
import Teams from '@/pages/Teams';
import TeamDetail from '@/pages/TeamDetail';
import Players from '@/pages/Players';
import Scorekeeper from '@/pages/Scorekeeper';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/live" element={<LiveGames />} />
        <Route path="/live/:id" element={<SpectatorView />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/players" element={<Players />} />
        <Route path="/scorekeeper" element={<Scorekeeper />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
