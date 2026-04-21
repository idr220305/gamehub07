import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import { ToastViewport } from "./components/ui/Toast.jsx";
import Home from "./pages/Home.jsx";
import GroupDashboard from "./pages/GroupDashboard.jsx";
import DailyGames from "./pages/DailyGames.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import PlayerStats from "./pages/PlayerStats.jsx";
import GroupSettings from "./pages/GroupSettings.jsx";
import Alliances from "./pages/Alliances.jsx";

export default function App() {
  return (
    <div className="min-h-full pb-20 sm:pb-0">
      <NavBar />
      <ToastViewport />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/group/:groupId" element={<RequireAuth><GroupDashboard /></RequireAuth>} />
          <Route path="/group/:groupId/games" element={<RequireAuth><DailyGames /></RequireAuth>} />
          <Route path="/group/:groupId/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
          <Route path="/group/:groupId/stats" element={<RequireAuth><PlayerStats /></RequireAuth>} />
          <Route path="/group/:groupId/settings" element={<RequireAuth><GroupSettings /></RequireAuth>} />
          <Route path="/group/:groupId/alliances" element={<RequireAuth><Alliances /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <footer className="container-app hidden py-8 text-center text-xs text-slate-400 sm:block">
        Daily Games Hub · play together
      </footer>
    </div>
  );
}
