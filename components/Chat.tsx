"use client";

import { useEffect, useState } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

type ThreadSummary = {
  thread_id: string;
  status: "idle" | "busy" | "interrupted" | "error";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
};

export default function ChatPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");

  // Hook oficial: maneja mensajes + streaming
  const stream = useStream<{ messages: Message[] }>({
    apiUrl:
      process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024",
    assistantId: process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent",
    messagesKey: "messages",
    threadId,
    onThreadId: setThreadId, // el hook te avisa si el server asigna/actualiza ID
    // (la guía muestra cómo retomar/rehidratar el historial con un threadId)
  });

  // Cargar lista de threads para el menú lateral
  useEffect(() => {
    fetch("/api/threads").then(async (r) => {
      const data = (await r.json()) as ThreadSummary[];
      setThreads(data);
    });
  }, []);

  // 🔁 useEffect: refresca lista cada vez que cambia threadId
  useEffect(() => {
    async function fetchThreads() {
      try {
        const r = await fetch("/api/threads");
        const data = (await r.json()) as ThreadSummary[];
        setThreads(data);
      } catch (err) {
        console.error("Error al obtener threads:", err);
      }
    }
    fetchThreads();
  }, [threadId]); // <- cada vez que cambie el hilo actual, se actualiza el menú

  function newChat() {
    if (stream.isLoading) void stream.stop();

    // 1) quitar cualquier threadId actual
    setThreadId(undefined);
  }

  function openThread(id: string) {
    // Cargar/retomar historial de ese thread (el hook lo maneja al montar/cambiar)
    setThreadId(id);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    stream.submit(
      { messages: [{ type: "human", content: text }] }
      // <- SIN segundo argumento (no mandes threadId)
    );
    setInput("");
  }

  return (
    <div className="grid grid-cols-[280px_1fr] h-[85vh] border rounded-2xl overflow-hidden">
      {/* Sidebar: lista de threads */}
      <aside className="bg-neutral-900 border-r overflow-auto">
        <div className="p-3 flex items-center justify-between">
          <h2 className="text-sm text-neutral-300">Conversaciones</h2>
          <button
            onClick={newChat}
            className="px-2 py-1 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-white"
            disabled={stream.isLoading}
          >
            Nuevo
          </button>
        </div>
        <ul className="px-2 pb-2 space-y-1">
          {threads.map((t) => (
            <li key={t.thread_id}>
              <button
                onClick={() => openThread(t.thread_id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  threadId === t.thread_id
                    ? "bg-neutral-800 text-white"
                    : "hover:bg-neutral-800 text-neutral-200"
                }`}
                title={t.thread_id}
              >
                <div className="truncate">{t.thread_id}</div>
                <div className="text-[11px] opacity-70">
                  {t.status} • {new Date(t.updated_at).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel de chat */}
      <section className="flex flex-col overflow-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b">
          <div className="text-xs text-neutral-400">
            {threadId ? `Thread: ${threadId}` : "Sin conversación"}
          </div>
          {stream.isLoading ? (
            <button
              onClick={() => stream.stop()}
              className="px-2 py-1 rounded bg-amber-600 text-white text-sm"
            >
              Detener
            </button>
          ) : null}
        </div>

        {/* Historial */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-neutral-950/30">
          {stream.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.type === "human" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow ${
                  m.type === "human"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-800 text-neutral-50"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {String(m.content ?? "")}
                </p>
              </div>
            </div>
          ))}
          {stream.isLoading && (
            <div className="text-xs text-neutral-400">
              El agente está respondiendo…
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-3 bg-neutral-900 border-t flex gap-2"
        >
          <input
            className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 outline-none"
            placeholder="Escribe tu mensaje…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-indigo-600 text-white"
            disabled={stream.isLoading}
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
