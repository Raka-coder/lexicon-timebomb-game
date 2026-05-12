import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { PlayPage } from "./pages/PlayPage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFound } from "./pages/error/NotFound";
import { Forbidden } from "./pages/error/Forbidden";
import { ServerError } from "./pages/error/ServerError";
import { Maintenance } from "./pages/error/Maintenance";
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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/error/403" element={<Forbidden />} />
        <Route path="/error/500" element={<ServerError />} />
        <Route path="/error/503" element={<Maintenance />} />
        <Route path="*" element={<NotFound />} />
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