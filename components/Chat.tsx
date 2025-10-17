"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";

export default function ChatPage() {
  // Hook oficial: maneja mensajes, loading y submit.
  const thread = useStream<{ messages: Message[] }>({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024",
    assistantId: process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent",
    messagesKey: "messages", // clave por defecto para acumular mensajes
    // Opcional: reconexión del stream tras refresh:
    // reconnectOnMount: true,
  });

  const [input, setInput] = useState("");

  return (
    <div className="mx-auto max-w-3xl h-[80vh] flex flex-col border rounded-2xl overflow-hidden">
      {/* Historial */}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-neutral-950/30">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex ${m.type === "human" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow ${m.type === "human" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-50"}`}>
              {/* En docs convierten el content a string al renderizar */}
              <p className="whitespace-pre-wrap leading-relaxed">
                {String(m.content ?? "")}
              </p>
            </div>
          </div>
        ))}
        {thread.isLoading && (
          <div className="text-xs text-neutral-400">El agente está respondiendo…</div>
        )}
        
      </div>

      {/* Caja de entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;
          // API oficial: submit con messages [{ type: "human", content: "..." }]
          thread.submit({ messages: [{ type: "human", content: text }] });
          setInput("");
        }}
        className="p-3 bg-neutral-900 border-t flex gap-2"
      >
        <input
          className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 outline-none"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {thread.isLoading ? (
          <button type="button" onClick={() => thread.stop()} className="px-4 py-3 rounded-xl bg-amber-600 text-white">
            Detener
          </button>
        ) : (
          <button type="submit" className="px-4 py-3 rounded-xl bg-indigo-600 text-white">
            Enviar
          </button>
        )}
      </form>
    </div>
  );
}
