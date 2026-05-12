import type { ChatMessage } from "@wrighter/shared";
import { useEffect, useRef, useState } from "react";
import { forgeIdea } from "../api/client";

const TEXTAREA_MAX_HEIGHT = 200;

function Spinner() {
  return (
    <span className="inline-flex items-center gap-2 text-gray-500">
      <span
        className="inline-block w-3 h-3 rounded-full border border-gray-600 border-t-gray-300 animate-spin"
        style={{ animationDuration: "0.8s" }}
        aria-hidden
      />
      <span className="italic">thinking…</span>
    </span>
  );
}

interface UIMessage extends ChatMessage {
  pending?: boolean;
}

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg-${Math.random().toString(36).slice(2)}`;

const SEED_MESSAGES: UIMessage[] = [
  {
    id: newId(),
    role: "system",
    content: "describe your idea.",
    createdAt: Date.now(),
  },
];

interface TerminalProps {
  visible: boolean;
  onCommit: (title: string) => void;
}

type Phase = "chat" | "naming";

export function Terminal({ visible, onCommit }: TerminalProps) {
  const [messages, setMessages] = useState<UIMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [phase, setPhase] = useState<Phase>("chat");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string>(newId());

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  // Auto-grow the textarea upward as content overflows. Capped at TEXTAREA_MAX_HEIGHT;
  // beyond that it scrolls internally rather than pushing further into the chat area.
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, TEXTAREA_MAX_HEIGHT);
    ta.style.height = `${next}px`;
  }, [input]);

  const startCommit = () => {
    if (streaming || phase !== "chat") return;
    setPhase("naming");
    setInput("");
  };

  const cancelCommit = () => {
    setPhase("chat");
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phase === "naming") {
      const title = input.trim();
      if (!title) return;
      onCommit(title);
      return;
    }

    if (streaming) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: UIMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantPlaceholder: UIMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      pending: true,
    };

    const historyForServer: ChatMessage[] = messages
      .filter((m) => !m.pending && m.role !== "system")
      .map(({ pending: _pending, ...rest }) => rest);

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setStreaming(true);

    try {
      let accumulated = "";
      for await (const event of forgeIdea(
        historyForServer,
        trimmed,
        conversationIdRef.current,
      )) {
        if (event.type === "token") {
          accumulated += event.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantPlaceholder.id ? { ...m, content: accumulated } : m,
            ),
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantPlaceholder.id
                ? {
                    ...m,
                    content: accumulated || `error: ${event.message}`,
                    pending: false,
                  }
                : m,
            ),
          );
          break;
        } else if (event.type === "done") {
          break;
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholder.id ? { ...m, pending: false } : m,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholder.id
            ? { ...m, content: `error: ${message}`, pending: false }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  };

  const promptGlyph = phase === "naming" ? "title:" : ">";

  const focusInput = () => {
    // Don't steal focus from text selection or button presses.
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={focusInput}
      className="absolute inset-0 flex flex-col font-mono text-sm text-white px-4 py-3 overflow-hidden cursor-text"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 350ms ease-out",
      }}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-2 leading-relaxed">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "system"
                ? "text-gray-400"
                : m.role === "user"
                  ? "text-white"
                  : "text-gray-200"
            }
          >
            <span className="text-gray-500 select-none mr-2">
              {m.role === "user" ? ">" : m.role === "system" ? "//" : "::"}
            </span>
            {m.pending && m.content === "" ? (
              <Spinner />
            ) : (
              <>
                <span className="whitespace-pre-wrap">{m.content}</span>
                {m.pending && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 -mb-0.5 bg-gray-400 animate-pulse" />
                )}
              </>
            )}
          </div>
        ))}
        {phase === "naming" && (
          <div className="text-gray-400 mt-3">// what should this idea node be called?</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2">
        <span className="text-gray-500 select-none pb-[2px]">{promptGlyph}</span>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={streaming && phase === "chat"}
          rows={1}
          className="flex-1 bg-transparent outline-none border-none text-white caret-white placeholder-gray-600 disabled:opacity-50 resize-none overflow-y-auto leading-relaxed"
          style={{ maxHeight: `${TEXTAREA_MAX_HEIGHT}px` }}
          placeholder=""
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {phase === "chat" ? (
          <button
            type="button"
            onClick={startCommit}
            disabled={streaming}
            className="text-[11px] uppercase tracking-wider text-gray-500 hover:text-white border border-gray-700 hover:border-gray-400 rounded px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            commit
          </button>
        ) : (
          <>
            <button
              type="submit"
              className="text-[11px] uppercase tracking-wider text-amber-400 hover:text-amber-300 border border-amber-700 hover:border-amber-500 rounded px-2 py-1 transition-colors"
            >
              create
            </button>
            <button
              type="button"
              onClick={cancelCommit}
              className="text-[11px] uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
            >
              cancel
            </button>
          </>
        )}
      </form>
    </div>
  );
}
