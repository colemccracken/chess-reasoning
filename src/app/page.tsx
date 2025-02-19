"use client";
import Chessground from "react-chessground";
import "react-chessground/dist/styles/chessground.css";
import { Chess } from "chess.js";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  // Move chess instance into component and use state to track position
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [isSimulating, setIsSimulating] = useState(false);
  const [chatLog, setChatLog] = useState<
    Array<{ reasoning: string; move: string; timestamp: number }>
  >([]);
  const simulationRef = useRef<boolean>(true);

  const simulateGame = async () => {
    simulationRef.current = true;
    while (!chess.isGameOver() && simulationRef.current) {
      const moves = chess.moves();
      console.log("Available moves:", moves);

      // Call the API to get the next move
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
        console.error("Error getting move from API");
        break;
      }

      const { completion } = await response.json();
      const reasoning = completion.choices[0].message.reasoning;
      const move = completion.choices[0].message.content;

      // Add the reasoning and move to the chat log
      setChatLog((prev) => [
        ...prev,
        {
          reasoning,
          move,
          timestamp: Date.now(),
        },
      ]);

      chess.move(move);

      // Update the fen state to trigger a re-render with new position
      setFen(chess.fen());
      console.log(chess.pgn());
    }
    setIsSimulating(false);
  };

  const handleSimulation = () => {
    if (isSimulating) {
      simulationRef.current = false;
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      simulateGame();
    }
  };

  return (
    <div className="flex gap-8 p-8">
      <div>
        <Chessground
          fen={fen}
          movable={{
            free: false,
            color: "white",
            dests: new Map(),
          }}
        />
        <button
          onClick={handleSimulation}
          type="button"
          className="mt-4 mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isSimulating ? "Stop" : "Start"}
        </button>
      </div>

      <div className="h-full w-full overflow-y-auto border rounded p-4">
        <h2 className="text-xl font-bold mb-4">Game Analysis</h2>
        {chatLog.map((entry) => (
          <div key={entry.timestamp} className="mb-6 p-4 rounded">
            <div className="flex items-center">
              <div className="text-sm">Move made:</div>
              <div className="ml-2 px-2 py-1 rounded font-mono">
                {entry.move}
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-sm cursor-pointer">Reasoning</summary>
              <p className="whitespace-pre-wrap mt-2 pl-4">{entry.reasoning}</p>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
