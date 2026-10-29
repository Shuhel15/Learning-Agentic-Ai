import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { jobDesc } = await request.json();

    //Checking if message is string or not or empty
    if (typeof jobDesc !== "string" || !jobDesc.trim()) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 },
      );
    }

    //Checking if Api key is missing or not
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API Key is not configured." },
        { status: 500 },
      );
    }

    //Calling google chat model
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });

    //Generating response through model my involing it.
    const response = await model.invoke([
      {
        role: "system",
        content:
          `Your are a professional job application assistant. Give clear, concise and professional response.
          1. Dont add any symbols like: ** ,
          `,
      },
      {
        role: "human",
        content: jobDesc,
      },
    ]);

    //If response is not in string then conver it into string then return.
    return NextResponse.json({
      reply:
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content),
    });
  } catch (error) {
    console.error("Agent API error:", error);

    return NextResponse.json(
      {
        error: "AI request failed. Check your API key and server",
      },
      { status: 500 },
    );
  }
}
