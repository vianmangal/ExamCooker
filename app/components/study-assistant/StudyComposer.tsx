"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, StopCircle } from "lucide-react";

interface StudyComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    isStreaming?: boolean;
    placeholder?: string;
    disabled?: boolean;
    variant?: "inline" | "sticky";
}

const MAX_HEIGHT = 200;

export function StudyComposer({
    value,
    onChange,
    onSend,
    onStop,
    isStreaming,
    placeholder,
    disabled,
    variant = "sticky",
}: StudyComposerProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (value.trim()) onSend();
        }
    };

    const isInline = variant === "inline";

    const wrapper = (
        <div className="relative mx-auto w-full max-w-3xl">
            <div className="relative rounded-2xl border border-black/10 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_40px_-16px_rgba(12,18,34,0.18)] ring-1 ring-black/[0.04] backdrop-blur-sm transition focus-within:border-[#4db3d6]/80 focus-within:ring-2 focus-within:ring-[#4db3d6]/25 dark:border-white/10 dark:bg-[#111826]/95 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.55)] dark:ring-white/[0.06] dark:focus-within:border-[#3BF4C7]/70 dark:focus-within:ring-[#3BF4C7]/20">
                <div className="flex items-end gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder ?? "ask anything…"}
                        disabled={disabled}
                        rows={1}
                        style={{ maxHeight: MAX_HEIGHT }}
                        className="min-h-[44px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-black placeholder:text-black/40 focus:outline-none dark:text-[#D5D5D5] dark:placeholder:text-[#D5D5D5]/40"
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={onStop}
                            aria-label="stop generating"
                            className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0C1222] text-white transition hover:brightness-110 active:scale-95 dark:bg-[#D5D5D5] dark:text-[#0C1222]"
                        >
                            <StopCircle className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => value.trim() && onSend()}
                            disabled={!value.trim() || disabled}
                            aria-label="send"
                            className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4db3d6] text-white transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40 dark:bg-[#3BF4C7] dark:text-[#0C1222] dark:disabled:bg-white/10 dark:disabled:text-white/40"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (isInline) {
        return <div className="w-full">{wrapper}</div>;
    }

    return (
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[#C2E6EC] via-[#C2E6EC]/98 to-transparent px-3 pb-3 pt-4 dark:from-[#0C1222] dark:via-[#0C1222]/98 sm:px-6 sm:pb-5 sm:pt-5">
            {wrapper}
        </div>
    );
}
