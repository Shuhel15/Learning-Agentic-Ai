// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { NextResponse } from "next/server";
import { tool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import getProfile from "@/profile";

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

    //Calling groq chat model
    const model = new ChatGroq({
      model: "openai/gpt-oss-120b",
      temperature: 0,
    });

    //Tools
    const getProfileTool = tool(() => getProfile(), {
      name: "get_profile",
      description:
        "Returns the user's professional profile, skills , experience, and portfolio links.",
      schema: z.object({}),
    });

    const modelWithTools = model.bindTools([getProfileTool]);

    const message = [
      {
        role: "system",
        content: `You are a professional job application assistant.
Generate a concise, professional job application email based on the job description.
Call the get_profile tool before writing the email.
Use only relevant skills and experience from the profile which matches job description.
Include the user's name, contact details, portfolio and GitHub links at the bottom.
Never invent details. Do not use Markdown bold symbols.`,
      },
      {
        role: "human",
        content: jobDesc,
      },
    ];

    const response = await modelWithTools.invoke(message);

    let finalResponse = response;

    if ((response.tool_calls?.length ?? 0) > 0) {
      const toolMessages = [];

      for (const toolCall of response.tool_calls ?? []) {
        if (toolCall.name !== "get_profile") {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }

        const result = await getProfileTool.invoke({});

        toolMessages.push(
          new ToolMessage({
            content: JSON.stringify(result),
            tool_call_id: toolCall.id!,
          }),
        );
      }
      finalResponse = await modelWithTools.invoke([
        ...message,
        response,
        ...toolMessages,
      ]);
    }

    return NextResponse.json({
      reply:
        typeof finalResponse.content === "string"
          ? finalResponse.content
          : JSON.stringify(finalResponse.content),
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
