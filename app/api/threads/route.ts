import { NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";

export async function GET() {
  const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024",
    apiKey: process.env.LANGGRAPH_API_KEY
  });

  // Ejemplos de filtros soportados por la doc: status, metadata, sort_by, sort_order, limit…
  // Aquí traemos los más recientes (idle/busy) del grafo “agent”.
  const list = await client.threads.search({
    status: "idle",                 // o "busy" | "interrupted" | "error"
    metadata: { graph_id: "agent" },
    limit: 50,
  });

  return NextResponse.json(list);
}
