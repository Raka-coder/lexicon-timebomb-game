import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { PlayPage } from "./pages/PlayPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { useSocket } from "@/hooks/useSocket";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Toaster } from "@/components/ui/sonner";

function AppContent() {
  const { socket } = useSocket();
  useGameSocket(socket);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
      <Toaster position="top-center" richColors theme="dark" />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;