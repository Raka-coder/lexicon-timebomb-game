  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
10:34:31 AM [vite] (client) Pre-transform error: [BabelError] /home/rakarestu/Documents/uas-webprog/frontend/src/pages/GamePage.tsx: Unexpected token (66:2)

  64 |       return () => clearTimeout(timer);
  65 |     }
> 66 |   }, [gameStatus, navigate]);
     |   ^
  67 |
  68 |   const handleSubmitWord = (word: string) => {
  69 |     socket?.emit("SUBMIT_WORD", { word });
10:34:31 AM [vite] Internal server error: [BabelError] /home/rakarestu/Documents/uas-webprog/frontend/src/pages/GamePage.tsx: Unexpected token (66:2)

  64 |       return () => clearTimeout(timer);
  65 |     }
> 66 |   }, [gameStatus, navigate]);
     |   ^
  67 |
  68 |   const handleSubmitWord = (word: string) => {
  69 |     socket?.emit("SUBMIT_WORD", { word });