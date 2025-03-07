"use client";
import Chessground from "react-chessground";
import "react-chessground/dist/styles/chessground.css";
import { Chess } from "chess.js";
import { useState } from "react";

export default function Home() {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [isThinking, setIsThinking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<
    Array<{
      reasoning?: string;
      move?: string;
      error?: string;
      timestamp: number;
    }>
  >([]);

  // Calculate valid moves for the current position
  const calcMovable = () => {
    const dests = new Map();
    if (chess.turn() === "w") {
      // Only allow moves when it's white's turn
      chess.moves({ verbose: true }).forEach((m) => {
        const moves = dests.get(m.from) || [];
        moves.push(m.to);
        dests.set(m.from, moves);
      });
    }
    return dests;
  };

  // Handle when a human makes a move
  const onMove = async (from: string, to: string) => {
    const move = chess.move({ from, to, promotion: "q" }); // Default to queen promotion
    if (move) {
      setFen(chess.fen());
      // After human moves, trigger AI's move
      await makeAIMove();
    }
  };

  const makeAIMove = async () => {
    if (chess.isGameOver() || chess.turn() !== "b") return;

    setIsThinking(true);
    const moves = chess.moves();
    console.log("Available moves:", moves);

    try {
      const response = await fetch("/api/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameState: chess.pgn(),
          availableMoves: moves,
        }),
      });

      if (!response.ok) {
        const errorMessage =
          "Failed to get move from AI. The server returned an error.";
        console.error(errorMessage);
        setLastError(errorMessage);
        setChatLog((prev) => [
          ...prev,
          {
            error: errorMessage,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const { completion } = await response.json();
      const reasoning = completion.choices[0].message.reasoning;
      const move = completion.choices[0].message.content;

      setChatLog((prev) => [
        ...prev,
        {
          reasoning,
          move,
          timestamp: Date.now(),
        },
      ]);

      chess.move(move);
      setFen(chess.fen());
      console.log(chess.pgn());
    } catch (error) {
      const errorMessage = `An error occurred while making the AI move: ${(error as Error).message}`;
      console.error(errorMessage);
      setLastError(errorMessage);
      setChatLog((prev) => [
        ...prev,
        {
          error: errorMessage,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRetry = () => {
    setLastError(null);
    makeAIMove();
  };

  const handleReset = () => {
    chess.reset();
    setFen(chess.fen());
    setChatLog([]);
    setLastError(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-8">
      <div>
        <Chessground
          fen={fen}
          movable={{
            free: false,
            color: "white",
            dests: calcMovable(),
          }}
          animation={{ duration: 500 }}
          turnColor={chess.turn() === "w" ? "white" : "black"}
          onMove={onMove}
        />
        <div className="flex my-8 w-full">
          <button
            onClick={handleReset}
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reset Game
          </button>
          <img
            src="/powered_by_groq.svg"
            alt="powered_by_groq"
            width={100}
            height={40}
            className="ml-auto invert"
          />
        </div>
      </div>

      <div className="h-full w-full overflow-y-auto border rounded p-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold">Game Analysis</h2>
          {isThinking && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Thinking...</div>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {chatLog.map((entry) => (
          <div key={entry.timestamp} className="mb-6 p-4 rounded">
            {entry.error ? (
              <div className="text-red-600">
                <div className="mb-2">{entry.error}</div>
                {entry.timestamp === chatLog[chatLog.length - 1]?.timestamp &&
                  lastError && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Retry Move
                    </button>
                  )}
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <div className="text-sm">Move made:</div>
                  <div className="ml-2 px-2 py-1 rounded font-mono">
                    {entry.move}
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">
                    Reasoning
                  </summary>
                  <p className="whitespace-pre-wrap mt-2 pl-4">
                    {entry.reasoning}
                  </p>
                </details>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
