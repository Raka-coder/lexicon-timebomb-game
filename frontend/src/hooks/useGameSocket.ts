import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useGameStore } from "../stores/gameStore";

export function useGameSocket(socket: Socket) {
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
      console.log("ROOM_CREATED:", roomCode);
      setRoom(roomCode, playerId, isHost);
    });

    socket.on("ROOM_JOINED", ({ roomCode, playerId, isHost }) => {
      console.log("ROOM_JOINED:", roomCode);
      setRoom(roomCode, playerId, isHost);
    });

    socket.on("PLAYER_JOINED", ({ players }) => {
      console.log("PLAYER_JOINED:", players);
      setPlayers(players);
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

    socket.on("GAME_STARTED", ({ players }) => {
      console.log("GAME_STARTED");
      setGameStatus("playing");
      setPlayers(players);
      setScores(players.reduce((acc: Record<string, number>, p: { id: string }) => {
        acc[p.id] = 0;
        return acc;
      }, {}));
    });

    socket.on("TURN_START", ({ currentPlayerId, currentWord, requiredLetter, scores }) => {
      console.log("TURN_START:", currentPlayerId, currentWord);
      setCurrentWord(currentWord);
      setRequiredLetter(requiredLetter);
      setCurrentPlayer(currentPlayerId);
      setScores(scores);
      setIsMyTurn(currentPlayerId === myPlayerId);
    });

    socket.on("WORD_VALID", ({ word, playerId, nextLetter, scores }) => {
      console.log("WORD_VALID:", word);
      addWordToHistory(word);
      setRequiredLetter(nextLetter);
      setScores(scores);
      setError(null);
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

    socket.on("GAME_OVER", ({ winnerId, scores, wordHistory }) => {
      console.log("GAME_OVER:", winnerId);
      setGameStatus("finished");
      setScores(scores);
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