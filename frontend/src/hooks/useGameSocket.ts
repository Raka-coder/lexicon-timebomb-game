import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

export function useGameSocket(socket: Socket | null) {
  if (!socket) return;
  
  const {
    setRoom,
    setPlayers,
    setGameStatus,
    setCurrentWord,
    setRequiredLetter,
    addWordToHistory,
    setCurrentPlayer,
    setScores,
    setTimeLeft,
    setIsMyTurn,
    setError,
    resetGameState,
    setWinnerLoser,
    myPlayerId,
  } = useGameStore();

  const prevTimeRef = useRef<number>(15);

  useEffect(() => {
    socket.on("ROOM_CREATED", ({ roomCode, playerId, playerName, isHost }) => {
      console.log(">> ROOM_CREATED:", roomCode, playerId, playerName, isHost);
      setRoom(roomCode, playerId, isHost);
      setGameStatus("waiting");
      setPlayers([{ id: playerId, name: playerName || "Player", isHost }]);
      toast.success("Ruangan berhasil dibuat!");
    });

    socket.on("ROOM_JOINED", ({ roomCode, playerId, playerName, isHost }) => {
      console.log(">> ROOM_JOINED:", roomCode, playerId, playerName, isHost);
      setRoom(roomCode, playerId, isHost);
      setGameStatus("waiting");
      setPlayers([{ id: playerId, name: playerName || "Player", isHost }]);
      toast.success("Berhasil masuk ruangan!");
    });

    socket.on("PLAYER_JOINED", ({ players }) => {
      console.log(">> PLAYER_JOINED:", JSON.stringify(players));
      if (players && Array.isArray(players) && players.length > 0) {
        const myId = useGameStore.getState().myPlayerId;
        const prevPlayerCount = useGameStore.getState().players.length;
        const newPlayer = players.find((p: any) => p.id !== myId);
        
        if (newPlayer && players.length > prevPlayerCount) {
          toast.info(`${newPlayer.name} bergabung ke ruangan`);
        }
        
        setPlayers(players);
      } else {
        setPlayers([]);
      }
    });

    socket.on("PLAYER_LEFT", ({ players, message }) => {
      console.log("PLAYER_LEFT:", message);
      if (players && Array.isArray(players)) {
        setPlayers(players);
      } else {
        setPlayers([]);
      }
      toast.error("Pemain telah keluar dari ruangan");
      if (message) setError(message);
    });

    socket.on("ROOM_ERROR", ({ message }) => {
      console.log("ROOM_ERROR:", message);
      toast.error(message);
      setError(message);
    });

    socket.on("GAME_STARTED", ({ players, currentWord, requiredLetter, currentPlayerId, scores }) => {
      const currentMyPlayerId = useGameStore.getState().myPlayerId;
      console.log(">> GAME_STARTED:", { currentWord, requiredLetter, currentPlayerId, myPlayerId: currentMyPlayerId });
      sfx.playPing();
      resetGameState();
      setGameStatus("playing");
      setPlayers(players);
      setCurrentWord(currentWord || "");
      setRequiredLetter(requiredLetter || "");
      setCurrentPlayer(currentPlayerId);
      setScores(scores || {});
      const amIPlaying = currentPlayerId === currentMyPlayerId;
      console.log(">> isMyTurn:", amIPlaying, "currentPlayerId:", currentPlayerId, "myPlayerId:", currentMyPlayerId);
      setIsMyTurn(amIPlaying);
      setTimeLeft(15);
      toast.success("Permainan dimulai!");
    });

    socket.on("TURN_START", ({ currentPlayerId, currentWord, requiredLetter, scores }) => {
      const currentMyPlayerId = useGameStore.getState().myPlayerId;
      console.log(">> TURN_START:", currentPlayerId, currentWord, requiredLetter, "myPlayerId:", currentMyPlayerId);
      setCurrentWord(currentWord || "");
      setRequiredLetter(requiredLetter || "");
      setCurrentPlayer(currentPlayerId);
      setScores(scores || {});
      const amIPlaying = currentPlayerId === currentMyPlayerId;
      console.log(">> TURN isMyTurn:", amIPlaying);
      setIsMyTurn(amIPlaying);
      setTimeLeft(15);
    });

    socket.on("WORD_VALID", ({ word, nextLetter, scores, currentPlayerId }) => {
      console.log(">> WORD_VALID:", word, nextLetter);
      sfx.playPing();
      addWordToHistory(word);
      setCurrentWord(word);
      setRequiredLetter(nextLetter || "");
      const currentMyPlayerId = useGameStore.getState().myPlayerId;
      if (currentPlayerId) {
        setCurrentPlayer(currentPlayerId);
        setIsMyTurn(currentPlayerId === currentMyPlayerId);
      }
      setScores(scores || {});
      setError(null);
      setTimeLeft(15);
    });

    socket.on("WORD_INVALID", ({ word, reason }) => {
      console.log("WORD_INVALID:", reason, word);
      sfx.playError();
      const messages: Record<string, string> = {
        not_your_turn: "Belum giliranmu!",
        too_short: "Kata minimal 3 huruf",
        wrong_start_letter: `Kata harus dimulai dengan huruf ${useGameStore.getState().requiredLetter}`,
        duplicate_word: "Kata sudah digunakan",
        not_in_dictionary: `Kata "${word}" tidak ditemukan di KBBI`,
      };
      const errorMessage = messages[reason] || "Kata tidak valid";
      setError(errorMessage);
      toast.error(errorMessage, { id: "word-error" }); // prevent duplicate toasts
    });

    socket.on("TIMER_SYNC", ({ timeLeft }) => {
      const currentIsMyTurn = useGameStore.getState().isMyTurn;
      if (timeLeft <= 4 && timeLeft > 0 && prevTimeRef.current > 4 && currentIsMyTurn) {
        sfx.playTick();
      }
      prevTimeRef.current = timeLeft;
      setTimeLeft(timeLeft);
    });

    socket.on("GAME_OVER", ({ winnerId, loserId, scores, roomStatus }) => {
      console.log(">> GAME_OVER:", { winnerId, loserId, roomStatus });
      sfx.playBoom();
      setWinnerLoser(winnerId, loserId);
      setGameStatus("finished");
      setScores(scores || {});
      
      const currentMyPlayerId = useGameStore.getState().myPlayerId;
      if (winnerId === currentMyPlayerId) {
        sfx.playSuccess();
        toast.success("Selamat! Kamu menang!", { duration: 5000 });
        setError("Selamat! Kamu menang!");
      } else if (loserId === currentMyPlayerId) {
        toast.error("Waktu habis! Kamu kalah!", { duration: 5000 });
        setError("Waktu habis! Kamu kalah!");
      } else {
        toast.info("Permainan selesai!", { duration: 5000 });
      }
    });

    socket.on("ROOM_RESET", ({ status }) => {
      console.log(">> ROOM_RESET:", status);
      const currentGameStatus = useGameStore.getState().gameStatus;
      
      if (currentGameStatus === "finished") {
        return;
      }
      
      if (status === "waiting") {
        resetGameState();
        toast.info("Ruangan telah di-reset untuk main lagi");
      }
    });

    return () => {
      socket.off("ROOM_CREATED");
      socket.off("ROOM_JOINED");
      socket.off("PLAYER_JOINED");
      socket.off("PLAYER_LEFT");
      socket.off("ROOM_ERROR");
      socket.off("GAME_STARTED");
      socket.off("TURN_START");
      socket.off("WORD_VALID");
      socket.off("WORD_INVALID");
      socket.off("TIMER_SYNC");
      socket.off("GAME_OVER");
      socket.off("ROOM_RESET");
    };
  }, [socket, myPlayerId, setIsMyTurn, setGameStatus, setPlayers, setError, setTimeLeft, addWordToHistory, setCurrentWord, setRequiredLetter, setCurrentPlayer, setScores, resetGameState, setRoom, setWinnerLoser]);
}