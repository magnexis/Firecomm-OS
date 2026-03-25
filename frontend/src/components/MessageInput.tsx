import React, { useState, useRef, useEffect } from "react";
import type { MessagePriority } from "../types";

interface MessageInputProps {
  onSend: (content: string, priority: MessagePriority) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled,
}) => {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<MessagePriority>("normal");
  const [showPriority, setShowPriority] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim()) return;
    onSend(content.trim(), priority);
    setContent("");
    setPriority("normal");
    setShowPriority(false);
    onTypingStop();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator
    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [content]);

  const priorityConfig = {
    normal: { label: "Normal", color: "text-dark-400", bg: "bg-dark-700" },
    priority: { label: "\u26A0 Priority", color: "text-amber-400", bg: "bg-amber-600/20" },
    emergency: { label: "\u{1F6A8} Emergency", color: "text-red-400", bg: "bg-red-600/20" },
  };

  return (
    <div className="border-t border-dark-700 bg-dark-900 p-3">
      {/* Priority selector */}
      {showPriority && (
        <div className="flex gap-2 mb-2 animate-fade-in">
          {(Object.keys(priorityConfig) as MessagePriority[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPriority(p);
                setShowPriority(false);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                priority === p
                  ? `${priorityConfig[p].bg} ${priorityConfig[p].color} ring-1 ring-current`
                  : "bg-dark-800 text-dark-400 hover:bg-dark-700"
              }`}
            >
              {priorityConfig[p].label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Priority toggle */}
        <button
          onClick={() => setShowPriority(!showPriority)}
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            priority !== "normal"
              ? `${priorityConfig[priority].bg} ${priorityConfig[priority].color}`
              : "bg-dark-800 text-dark-400 hover:bg-dark-700"
          }`}
          title="Set message priority"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connect to start messaging..." : "Type a message..."}
          disabled={disabled}
          rows={1}
          className="input-field flex-1 resize-none text-sm min-h-[40px] max-h-[120px] disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          className="btn-primary p-2 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
