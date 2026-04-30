import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";

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
    myPlayerId,
  } = useGameStore();

  useEffect(() => {
    socket.on("ROOM_CREATED", ({ roomCode, playerId, isHost }) => {
      console.log(">> ROOM_CREATED:", roomCode, playerId, isHost);
      setRoom(roomCode, playerId, isHost);
      setGameStatus("waiting");
      setPlayers([{ id: playerId, name: "Kamu", isHost }]);
    });

    socket.on("ROOM_JOINED", ({ roomCode, playerId, isHost }) => {
      console.log(">> ROOM_JOINED:", roomCode, playerId, isHost);
      setRoom(roomCode, playerId, isHost);
      setGameStatus("waiting");
      setPlayers([{ id: playerId, name: "Kamu", isHost: false }]);
    });

    socket.on("PLAYER_JOINED", ({ players }) => {
      console.log(">> PLAYER_JOINED:", JSON.stringify(players));
      if (players && players.length > 0) {
        setPlayers(players);
      }
    });

    socket.on("PLAYER_LEFT", ({ players, message }) => {
      console.log("PLAYER_LEFT:", message);
      setPlayers(players);
      if (message) setError(message);
    });

    socket.on("ROOM_ERROR", ({ message }) => {
      console.log("ROOM_ERROR:", message);
      setError(message);
    });

    socket.on("GAME_STARTED", ({ players, currentWord, requiredLetter, currentPlayerId, scores }) => {
      console.log(">> GAME_STARTED:", { currentWord, requiredLetter, currentPlayerId });
      setGameStatus("playing");
      setPlayers(players);
      setCurrentWord(currentWord || "");
      setRequiredLetter(requiredLetter || "");
      setCurrentPlayer(currentPlayerId);
      setScores(scores || {});
      setIsMyTurn(currentPlayerId === myPlayerId);
      setTimeLeft(15);
    });

    socket.on("TURN_START", ({ currentPlayerId, currentWord, requiredLetter, scores }) => {
      console.log(">> TURN_START:", currentPlayerId, currentWord, requiredLetter);
      setCurrentWord(currentWord || "");
      setRequiredLetter(requiredLetter || "");
      setCurrentPlayer(currentPlayerId);
      setScores(scores || {});
      setIsMyTurn(currentPlayerId === myPlayerId);
      setTimeLeft(15);
    });

    socket.on("WORD_VALID", ({ word, nextLetter, scores, currentPlayerId }) => {
      console.log(">> WORD_VALID:", word, nextLetter);
      addWordToHistory(word);
      setCurrentWord(word);
      setRequiredLetter(nextLetter || "");
      if (currentPlayerId) {
        setCurrentPlayer(currentPlayerId);
        setIsMyTurn(currentPlayerId === myPlayerId);
      }
      setScores(scores || {});
      setError(null);
      setTimeLeft(15);
    });

    socket.on("WORD_INVALID", ({ word, reason }) => {
      console.log("WORD_INVALID:", reason, word);
      const messages: Record<string, string> = {
        not_your_turn: "Belum giliranmu!",
        too_short: "Kata minimal 3 huruf",
        wrong_start_letter: `Kata harus dimulai dengan huruf ${useGameStore.getState().requiredLetter}`,
        duplicate_word: "Kata sudah digunakan",
        not_in_dictionary: `Kata "${word}" tidak ditemukan di KBBI`,
      };
      setError(messages[reason] || "Kata tidak valid");
    });

    socket.on("TIMER_SYNC", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on("GAME_OVER", ({ winnerId, loserId, reason, scores, wordHistory }) => {
      console.log(">> GAME_OVER:", { winnerId, loserId, reason });
      setGameStatus("finished");
      setScores(scores || {});
      if (winnerId === myPlayerId) {
        setError("Selamat! Kamu menang! 🎉");
      } else if (loserId === myPlayerId) {
        setError("Waktu habis! Kamu kalah! 💥");
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
    };
  }, [socket, myPlayerId, setGameStatus, setPlayers, setError]);
}