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

type MeteorologicalDiagramDescriptor = {
  type: "skew_t_diagram" | "hodograph_diagram";
  profile?: {
    profile_id?: number;
    date?: string;
    time?: string | null;
    station?: string | null;
  };
  image_path: string;
  download_path: string;
  filename: string;
  summary?: string;
};

type RadiosondeReportDescriptor = {
  type: "radiosonde_report";
  report_id: number;
  status: "pending" | "processing" | "ready" | "failed";
  start_date: string;
  end_date: string;
  time?: string | null;
  profile_count: number;
  processed_count: number;
  failed_count: number;
  progress_percent: number;
  status_path: string;
  view_path?: string | null;
  download_path?: string | null;
  filename: string;
  error?: string | null;
};

function parseDiagramDescriptor(
  message: Message
): MeteorologicalDiagramDescriptor | null {
  if (message.type !== "tool") return null;

  try {
    const raw = message.content;
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;

    const candidate = value as Partial<MeteorologicalDiagramDescriptor>;
    const diagramPath =
      candidate.type === "skew_t_diagram" ? "/skew-t/image" : "/hodograph/image";
    if (
      !["skew_t_diagram", "hodograph_diagram"].includes(candidate.type ?? "") ||
      typeof candidate.image_path !== "string" ||
      typeof candidate.download_path !== "string" ||
      typeof candidate.filename !== "string" ||
      !candidate.image_path.startsWith("/api/radiosondes/") ||
      !candidate.download_path.startsWith("/api/radiosondes/") ||
      !candidate.image_path.endsWith(diagramPath) ||
      !candidate.download_path.startsWith(`${candidate.image_path}?`)
    ) {
      return null;
    }
    return candidate as MeteorologicalDiagramDescriptor;
  } catch {
    return null;
  }
}

function parseReportDescriptor(
  message: Message
): RadiosondeReportDescriptor | null {
  if (message.type !== "tool") return null;

  try {
    const raw = message.content;
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Partial<RadiosondeReportDescriptor>;
    if (
      candidate.type !== "radiosonde_report" ||
      typeof candidate.report_id !== "number" ||
      !["pending", "processing", "ready", "failed"].includes(
        candidate.status ?? ""
      ) ||
      typeof candidate.status_path !== "string" ||
      !/^\/api\/radiosonde-reports\/\d+$/.test(candidate.status_path) ||
      typeof candidate.filename !== "string"
    ) {
      return null;
    }
    return candidate as RadiosondeReportDescriptor;
  } catch {
    return null;
  }
}

function RadiosondeReportCard({
  initial,
}: {
  initial: RadiosondeReportDescriptor;
}) {
  const [report, setReport] = useState(initial);

  useEffect(() => {
    if (!['pending', 'processing'].includes(report.status)) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      try {
        const response = await fetch(report.status_path, { cache: "no-store" });
        if (response.ok && !cancelled) {
          const next = (await response.json()) as RadiosondeReportDescriptor;
          setReport(next);
          if (["pending", "processing"].includes(next.status)) {
            timeoutId = setTimeout(refresh, 3000);
          }
          return;
        }
      } catch (error) {
        console.error("Error al actualizar el informe:", error);
      }
      if (!cancelled) timeoutId = setTimeout(refresh, 5000);
    }

    timeoutId = setTimeout(refresh, 1500);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [report.status, report.status_path]);

  const ready = report.status === "ready";
  const failed = report.status === "failed";
  const statusLabel = ready
    ? "Informe listo"
    : failed
      ? "No se pudo generar"
      : "Generando informe";

  return (
    <div className="flex justify-start">
      <article className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">Informe de radiosondeos</h3>
              <p className="mt-1 text-sm text-gray-600">
                {report.start_date} a {report.end_date}
                {report.time ? ` · ${report.time}` : " · todas las horas"}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                ready
                  ? "bg-emerald-100 text-emerald-800"
                  : failed
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-gray-700">
            Perfiles: {report.processed_count} de {report.profile_count}
            {report.failed_count > 0 ? ` · parciales o fallidos: ${report.failed_count}` : ""}
          </p>
          {!ready && !failed ? (
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.max(2, report.progress_percent)}%` }}
              />
            </div>
          ) : null}
          {failed && report.error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {report.error}
            </p>
          ) : null}
          {ready && report.view_path && report.download_path ? (
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={report.view_path}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Ver PDF
              </a>
              <a
                href={report.download_path}
                download={report.filename}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Descargar PDF
              </a>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function getMessageText(message: Message): string {
  const content: unknown = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";

      const block = part as { type?: unknown; text?: unknown; content?: unknown };
      if (block.type === "text" && typeof block.text === "string") {
        return block.text;
      }
      if (typeof block.content === "string") return block.content;
      return "";
    })
    .filter((text) => text.trim().length > 0)
    .join("\n");
}

function hasVisibleMessageText(message: Message): boolean {
  return getMessageText(message).trim().length > 0;
}

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
      const content = getMessageText(firstMessage);
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
            Nuevo Chat
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
          .filter(
            (m) =>
              parseDiagramDescriptor(m) !== null ||
              parseReportDescriptor(m) !== null ||
              ((m.type === "human" || m.type === "ai") &&
                hasVisibleMessageText(m))
          )
          .map((m, index) => {
            const diagram = parseDiagramDescriptor(m);
            const report = parseReportDescriptor(m);
            if (report) {
              return (
                <RadiosondeReportCard
                  key={m.id ?? `report-${index}`}
                  initial={report}
                />
              );
            }
            if (diagram) {
              const profile = diagram.profile;
              const isSkewT = diagram.type === "skew_t_diagram";
              const diagramName = isSkewT ? "Diagrama Skew-T" : "Hodógrafo";
              return (
                <div key={m.id ?? `diagram-${index}`} className="flex justify-start">
                  <article className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <h3 className="font-semibold text-gray-900">{diagramName}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {profile?.station ?? "La Paz"}
                        {profile?.date ? ` · ${profile.date}` : ""}
                        {profile?.time ? ` · ${profile.time}` : ""}
                      </p>
                    </div>
                    <a
                      href={diagram.image_path}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-gray-50 p-3"
                      title="Abrir imagen en tamaño completo"
                    >
                      <img
                        src={diagram.image_path}
                        alt={`${diagramName} ${profile?.date ?? ""}`.trim()}
                        className="mx-auto h-auto max-h-[720px] w-auto max-w-full rounded-lg bg-white"
                        loading="lazy"
                      />
                    </a>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <p className="text-sm text-gray-600">
                        {diagram.summary ?? diagram.filename}
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={diagram.image_path}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Ampliar
                        </a>
                        <a
                          href={diagram.download_path}
                          download={diagram.filename}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Descargar PNG
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
              );
            }

            return (
              <div
                key={m.id ?? `message-${index}`}
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
                    {getMessageText(m)}
                  </p>
                </div>
              </div>
            );
          })}
          {stream.isLoading && (
            <div className="text-xs text-gray-500 italic">
              El agente está pensando…
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
