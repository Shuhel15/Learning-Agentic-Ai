import { START,StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import getProfile from "@/profile";



//llm Model
const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.1,
});

//Tool
const getProfileTool = tool(() => getProfile(), {
  name: "get_profile",
  description:
    "Return the user's professional profile , skills , experience and contact details",
  schema: z.object({}),
});

const tools = [getProfileTool];

//Binding model with tool
const modelWithTools = model.bindTools(tools);

//Tool Node
const toolNode = new ToolNode(tools);

//Agent Node
const agent = async (state: typeof MessagesAnnotation.State) => {

  const response = await modelWithTools.invoke([
    {
      role: "system",
      content: `You are a professional job application assistant.
      Generate a concise, professional job application email based on the job description.
      Call the get_profile tool before writing the email.
      Use only relevant skills and experience from the profile which matches job description.
      Include the user's name, contact details, portfolio and GitHub links.
      Dont add any symbols like: ** or emojis in the response.
      Never invent details.`,
    },
    ...state.messages
  ]);
  
  return {
    messages: [response]
  }
};

const graph = new StateGraph(MessagesAnnotation)
.addNode("agent",agent)
.addNode("tools", toolNode)
.addEdge(START,"agent")
.addConditionalEdges("agent", toolsCondition)
.addEdge("tools","agent")

const app = graph.compile()

export default app;

