import { CrowClient, type Message } from "@usecrow/client";
import { AlertCircle, Loader2, RotateCcw, Send, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CrowPageContext } from "../../lib/crowContext";
import "./route66-chat.css";

interface Route66ChatBubbleProps {
  productId: string;
  apiUrl?: string;
  crowContext?: CrowPageContext;
}

export default function Route66ChatBubble({
  productId,
  apiUrl = "https://api.usecrow.org",
  crowContext,
}: Route66ChatBubbleProps) {
  const clientRef = useRef<CrowClient | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const client = new CrowClient({ productId, apiUrl });
    clientRef.current = client;

    if (crowContext) {
      client.setContext(crowContext);
    }

    const unsubscribeMessages = client.onMessages((next) => {
      setMessages([...next]);
    });
    const unsubscribeLoading = client.onLoading((loading) => {
      setIsLoading(loading);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeLoading();
      client.stop();
      client.destroy();
      clientRef.current = null;
    };
  }, [productId, apiUrl]);

  useEffect(() => {
    if (!crowContext || !clientRef.current) return;
    clientRef.current.setContext(crowContext);
  }, [crowContext]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isLoading, error]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen]);

  const quickPrompts = [
    "What happened on this stop?",
    "How was the weather out here?",
    "Give me the funniest recap.",
  ];
  const lastMessage = messages.at(-1);
  const showLoadingPlaceholder = isLoading && !(lastMessage?.role === "assistant" && lastMessage.content.trim());

  const sendMessage = async (rawText = draft) => {
    const text = rawText.trim();
    if (!text || isLoading || !clientRef.current) return;

    setError(null);
    setDraft("");
    clientRef.current.setContext(crowContext ?? { pageType: "site_page", path: window.location.pathname });

    try {
      for await (const event of clientRef.current.sendMessage(text)) {
        if (event.type === "error") {
          setError(event.message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message.";
      setError(message);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const resetConversation = () => {
    setError(null);
    clientRef.current?.clearMessages();
  };

  const stopGeneration = () => {
    clientRef.current?.stop();
  };

  const submitPrompt = (prompt: string) => {
    void sendMessage(prompt);
  };

  return (
    <div className="route66-chat" data-open={isOpen ? "true" : "false"}>
      {isOpen && (
        <section className="route66-chat__panel" aria-label="Route 66 chat assistant">
          <header className="route66-chat__header">
            <div className="route66-chat__header-copy">
              <p className="route66-chat__eyebrow">Route 66 Agent</p>
            </div>
            <div className="route66-chat__header-actions">
              <button
                type="button"
                className="route66-chat__icon-btn"
                onClick={resetConversation}
                aria-label="Start new chat"
                title="Start new chat"
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="route66-chat__icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="route66-chat__messages" ref={messagesRef}>
            {messages.length === 0 && !isLoading && !error && (
              <section className="route66-chat__empty" aria-label="Chat suggestions">
                <p className="route66-chat__empty-title">Co-pilot mode is awake.</p>
                <p className="route66-chat__empty-copy">
                  Ask about the route, the weather, or who made the strongest case for a gas-station hot dog.
                </p>
                <div className="route66-chat__prompt-list">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="route66-chat__prompt-chip"
                      onClick={() => submitPrompt(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {messages.map((message) => (
              (message.role !== "assistant" || message.content.trim()) && (
                <article key={message.id} className={`route66-chat__msg route66-chat__msg--${message.role}`}>
                  <div className="route66-chat__msg-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                </article>
              )
            ))}

            {showLoadingPlaceholder && (
              <article className="route66-chat__msg route66-chat__msg--assistant route66-chat__msg--loading" aria-label="Loading">
                <div className="route66-chat__loading-topline">
                  <Loader2 size={15} aria-hidden="true" />
                  <p className="route66-chat__loading-label">Thinking at highway speed...</p>
                </div>
                <div className="route66-chat__loading-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            )}
            {error && (
              <div className="route66-chat__icon-state route66-chat__icon-state--error" title={error} aria-label={error}>
                <AlertCircle size={16} />
              </div>
            )}
          </div>

          <footer className="route66-chat__footer">
            <form onSubmit={onSubmit} className="route66-chat__form">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Ask the road about this page..."
                aria-label="Message input"
                className="route66-chat__input"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <div className="route66-chat__actions">
                {isLoading && (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="route66-chat__secondary-btn"
                    aria-label="Stop response"
                    title="Stop response"
                  >
                    <Square size={14} aria-hidden="true" />
                  </button>
                )}
                {!isLoading && (
                  <button
                    type="submit"
                    className="route66-chat__primary-btn"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                    title="Send message"
                  >
                    <Send size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          </footer>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          className="route66-chat__launcher"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-label="Open Route 66 Agent"
        >
          <span className="route66-chat__launcher-badge">66</span>
        </button>
      )}
    </div>
  );
}
