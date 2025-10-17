// lib/langgraph.ts
import { Client } from "@langchain/langgraph-sdk";

export const lgClient = new Client({
  apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL!, // p.ej. http://localhost:2024
  apiKey: process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY || undefined,
});
