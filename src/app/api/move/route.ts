export const maxDuration = 60;

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface MoveRequest {
  gameState: string;
  availableMoves: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoveRequest;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an excellent chess player. You think several moves ahead and develop long term plans in order to win the game. You are given a game state and list of available moves, and you will select the best move from the available options. Respond only with the selected move, no additional explanation. Be concise.",
        },
        {
          role: "user",
          content: `Current game state: ${body.gameState}\nAvailable moves: ${body.availableMoves.join(", ")}\n\nSelect one move from the available moves list.`,
        },
      ],
      reasoning_format: "parsed",
      model: "qwen-qwq-32b",
      temperature: 0.6,
      top_p: 0.95,
    });
    // Transform the stream into a text response
    return NextResponse.json({ completion: completion });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
