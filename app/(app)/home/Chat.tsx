"use client";

import { useEffect, useState, useRef } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

type ThreadSummary = {
  thread_id: string;
  status: "idle" | "busy" | "interrupted" | "error";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  values?: { messages?: Message[] }; 
};

export default function ChatPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stream = useStream<{ messages: Message[] }>({
    apiUrl:
      process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:2024",
    assistantId: process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID || "agent",
    messagesKey: "messages",
    threadId,
    onThreadId: setThreadId,
  });

  useEffect(() => {
    fetch("/api/threads").then(async (r) => {
      const data = (await r.json()) as ThreadSummary[];
      setThreads(data);
    });
  }, []);

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
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.messages]); // Triggers when messages array changes

  function newChat() {
    if (stream.isLoading) void stream.stop();
    setThreadId(undefined);
  }

  function openThread(id: string) {
    setThreadId(id);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    stream.submit({ messages: [{ type: "human", content: text }] });
    setInput("");
  }

  function getThreadTitle(thread: ThreadSummary): string {
    // 1. Try metadata title first
    if (thread.metadata?.title) {
      return String(thread.metadata.title);
    }

    // 2. Try first message from values
    if (thread.values?.messages && thread.values.messages.length > 0) {
      const firstMessage = thread.values.messages[0];
      const content = String(firstMessage.content ?? "");
      return content.slice(0, 50) + (content.length > 50 ? "..." : "");
    }

    // 3. Fallback to formatted date
    return `Chat ${new Date(thread.created_at).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return (
    <div className="grid grid-cols-[280px_1fr] h-[85vh] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg">
      {/* Sidebar: lista de threads */}
      <aside className="bg-gray-50 border-r border-gray-200 overflow-auto">
        <div className="p-3 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Conversaciones</h2>
          <button
            onClick={newChat}
            className="px-2 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            disabled={stream.isLoading}
          >
            Nuevo
          </button>
        </div>
        <ul className="px-2 pb-2 space-y-1 mt-2">
          {threads.map((t) => (
            <li key={t.thread_id}>
              <button
                onClick={() => openThread(t.thread_id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  threadId === t.thread_id
                    ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                    : "hover:bg-gray-100 text-gray-700 border border-transparent"
                }`}
                title={t.thread_id}
              >
                <div className="truncate font-medium">
                  {getThreadTitle(t)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {t.status} • {new Date(t.updated_at).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel de chat */}
      <section className="flex flex-col overflow-auto bg-white">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          {stream.isLoading ? (
            <button
              onClick={() => stream.stop()}
              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white text-sm transition-colors"
            >
              Detener
            </button>
          ) : null}
        </div>

        {/* Historial */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50/50">
          {stream.messages
          .filter((m) => m.type === "human" || m.type === "ai")
          .map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.type === "human" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.type === "human"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {String(m.content ?? "")}
                </p>
              </div>
            </div>
          ))}
          {stream.isLoading && (
            <div className="text-xs text-gray-500 italic">
              El agente está respondiendo…
            </div>
          )}
          {/*Invisible div at the bottom to scroll to */}
          {/* <div ref={messagesEndRef} /> */}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-3 bg-white border-t border-gray-200 flex gap-2"
        >
          <input
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 placeholder-gray-500 transition-all"
            placeholder="Escribe tu mensaje…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={stream.isLoading}
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}