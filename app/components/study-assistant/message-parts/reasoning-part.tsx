"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Streamdown } from "streamdown";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { streamdownPlugins } from "@/lib/streamdown-config";

interface ReasoningPartProps {
    id: string;
    text: string;
    isStreaming?: boolean;
}

const SpinnerIcon = React.memo(function SpinnerIcon() {
    return (
        <svg
            className="animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
});

function isEmpty(text: string): boolean {
    return !text || text.trim() === "" || /^\n+$/.test(text);
}

export const ReasoningPart = memo(function ReasoningPart({
    id,
    text,
    isStreaming,
}: ReasoningPartProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [autoExpanded, setAutoExpanded] = useState(false);
    const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isThinking, setIsThinking] = useState(!!isStreaming);
    const [duration, setDuration] = useState(0);

    const startedAt = useRef<number | null>(isStreaming ? Date.now() : null);
    const thinkingTimer = useRef<number | null>(null);
    const collapseTimer = useRef<number | null>(null);
    const hasReasoning = !isEmpty(text);

    useEffect(() => {
        if (isStreaming) {
            if (thinkingTimer.current != null) {
                window.clearTimeout(thinkingTimer.current);
                thinkingTimer.current = null;
            }
            setIsThinking(true);
            if (startedAt.current === null) startedAt.current = Date.now();
        } else {
            if (thinkingTimer.current == null) {
                thinkingTimer.current = window.setTimeout(() => {
                    setIsThinking(false);
                    if (startedAt.current !== null) {
                        setDuration(
                            Math.max(
                                1,
                                Math.round((Date.now() - startedAt.current) / 1000)
                            )
                        );
                        startedAt.current = null;
                    }
                    thinkingTimer.current = null;
                }, 150);
            }
        }
        return () => {
            if (thinkingTimer.current != null) {
                window.clearTimeout(thinkingTimer.current);
                thinkingTimer.current = null;
            }
        };
    }, [isStreaming, text]);

    useEffect(() => {
        if (isThinking && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isThinking, text]);

    useEffect(() => {
        if (collapseTimer.current != null) {
            window.clearTimeout(collapseTimer.current);
            collapseTimer.current = null;
        }
        if (userExpanded !== null) return;
        if (isThinking) {
            setAutoExpanded(hasReasoning);
            return;
        }
        collapseTimer.current = window.setTimeout(() => {
            setAutoExpanded(false);
            collapseTimer.current = null;
        }, 900);
        return () => {
            if (collapseTimer.current != null) {
                window.clearTimeout(collapseTimer.current);
                collapseTimer.current = null;
            }
        };
    }, [hasReasoning, isThinking, text, userExpanded]);

    const isExpanded = userExpanded ?? autoExpanded;

    if (!hasReasoning && !isThinking) return null;

    const bodyClass =
        "px-3 py-2.5 text-[12.5px] font-medium leading-relaxed text-black/75 dark:text-[#D5D5D5]/75";

    return (
        <div className="mt-4 mb-2" data-reasoning-id={id}>
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-white/[0.06]">
                <div
                    onClick={() => !isThinking && setUserExpanded(!isExpanded)}
                    className={[
                        "flex items-center justify-between px-3 py-2",
                        !isThinking
                            ? "cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                            : "",
                    ].join(" ")}
                >
                    <div className="flex min-h-[1.5rem] items-center gap-2">
                        {isThinking ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.04] px-2 py-1 text-[11px] font-medium text-black/75 dark:border-white/10 dark:bg-white/[0.08] dark:text-[#D5D5D5]/85">
                                <div className="size-2.5 text-black/70 dark:text-[#D5D5D5]/80">
                                    <SpinnerIcon />
                                </div>
                                <span>Thinking</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-black/60 dark:text-[#D5D5D5]/60">
                                Reasoning
                                {duration > 0 && (
                                    <span className="tabular-nums opacity-70">
                                        · {duration}s
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-black/50 dark:text-[#D5D5D5]/50">
                        {!isThinking &&
                            (isExpanded ? (
                                <ChevronUp className="size-3" />
                            ) : (
                                <ChevronDown className="size-3" />
                            ))}
                        {(isThinking || isExpanded) && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFullscreen((f) => !f);
                                }}
                                aria-label={isFullscreen ? "Minimize" : "Maximize"}
                                className="rounded p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="size-3" strokeWidth={2} />
                                ) : (
                                    <Maximize2 className="size-3" strokeWidth={2} />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {hasReasoning && (isThinking || isExpanded) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="border-t border-black/[0.06] dark:border-white/[0.08]"
                        >
                            <div
                                ref={scrollRef}
                                className={[
                                    "overflow-y-auto bg-transparent",
                                    isFullscreen
                                        ? "max-h-[60vh] rounded-b-xl"
                                        : `max-h-[220px] rounded-b-xl${isThinking && !hasReasoning ? " min-h-[5rem]" : ""}`,
                                ].join(" ")}
                            >
                                <div className={bodyClass}>
                                    {hasReasoning ? (
                                        isThinking ? (
                                            <div className="not-prose whitespace-pre-wrap break-words font-sans font-medium text-black/65 dark:text-[#D5D5D5]/65">
                                                {text}
                                            </div>
                                        ) : (
                                            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none font-sans font-medium [&_li]:my-0.5 [&_ol]:my-1 [&_p]:my-1 [&_p]:leading-relaxed [&_ul]:my-1">
                                                <Streamdown plugins={streamdownPlugins}>
                                                    {text}
                                                </Streamdown>
                                            </div>
                                        )
                                    ) : (
                                        <div
                                            aria-hidden
                                            className="select-none text-black/35 dark:text-[#D5D5D5]/35"
                                        >
                                            &nbsp;
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});
