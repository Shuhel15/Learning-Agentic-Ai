
import { NextResponse } from "next/server";
import agent from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const { jobDesc } = await request.json();

    // Validate job description
    if (typeof jobDesc !== "string" || !jobDesc.trim()) {
      return NextResponse.json(
        { error: "Please enter a job description." },
        { status: 400 }
      );
    }

    // Check Groq API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured." },
        { status: 500 }
      );
    }

    // Execute LangGraph agent
    const result = await agent.invoke({
      messages: [
        {
          role: "human",
          content: jobDesc,
        },
      ],
    });

    // Get final AI response
    const finalMessage =
      result.messages[result.messages.length - 1];

    return NextResponse.json({
      reply:
        typeof finalMessage.content === "string"
          ? finalMessage.content
          : JSON.stringify(finalMessage.content),
    });

  } catch (error) {
    console.error("Agent API error:", error);

    return NextResponse.json(
      { error: "AI request failed. Check your API key and server." },
      { status: 500 }
    );
  }
}
