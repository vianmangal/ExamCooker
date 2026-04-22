"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { ChatStatus, UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { MessagePartRenderer } from "./message-parts";
import { ReasoningPart } from "./message-parts/reasoning-part";

type PartLike = { type?: string; text?: string };

function partitionPartsForRender(parts: PartLike[]) {
    type Row =
        | { kind: "reasoning"; start: number; end: number; text: string }
        | { kind: "other"; index: number };
    const rows: Row[] = [];
    let i = 0;
    while (i < parts.length) {
        const p = parts[i];
        if (p.type === "reasoning") {
            const start = i;
            const chunks: string[] = [(p.text ?? "")];
            while (i + 1 < parts.length && parts[i + 1].type === "reasoning") {
                i++;
                chunks.push(parts[i].text ?? "");
            }
            rows.push({
                kind: "reasoning",
                start,
                end: i,
                text: chunks.join("\n\n"),
            });
            i++;
        } else {
            rows.push({ kind: "other", index: i });
            i++;
        }
    }
    return rows;
}

interface MessagesProps {
    messages: UIMessage[];
    status: ChatStatus;
    isStreaming?: boolean;
    isTransitioning?: boolean;
    pendingUserText?: string | null;
}

function assistantHasVisibleContent(parts: unknown[]): boolean {
    for (const p of parts) {
        const part = p as { type?: string; text?: string };
        if (part.type === "reasoning") return true;
        if (part.type === "text" && part.text?.trim()) return true;
        if (isToolUIPart(p as never)) {
            return true;
        }
    }
    return false;
}

export const StudyMessages = memo(function StudyMessages({
    messages,
    status,
    isStreaming,
    isTransitioning,
    pendingUserText,
}: MessagesProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const userScrolledUp = useRef(false);
    const lastLenRef = useRef(messages.length);
    const clampRafRef = useRef<number | null>(null);

    const lastUserIndex = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]?.role === "user") return i;
        }
        return -1;
    }, [messages]);

    const firstUserIndex = useMemo(() => {
        for (let i = 0; i < messages.length; i++) {
            if (messages[i]?.role === "user") return i;
        }
        return -1;
    }, [messages]);

    const shouldShowBottomLoader = useMemo(() => {
        if (messages.length === 0 && isTransitioning) return true;
        const last = messages[messages.length - 1];
        if (!last) return false;
        if (last.role === "user") return true;
        if (status === "submitted") return true;
        if (status === "streaming" && last.role === "assistant") {
            const parts = Array.isArray(last.parts) ? last.parts : [];
            if (parts.length === 0) return true;
            return !assistantHasVisibleContent(parts);
        }
        return false;
    }, [isTransitioning, messages, status]);

    const shouldReserveLoaderMinHeight = useMemo(() => {
        if (messages.length === 0 && isTransitioning) return true;
        const last = messages[messages.length - 1];
        if (!last) return false;
        if (last.role === "user") return true;
        if (status === "submitted") return true;
        if (status === "streaming" && last.role === "assistant") {
            const parts = Array.isArray(last.parts) ? last.parts : [];
            if (parts.length === 0) return true;
            return !assistantHasVisibleContent(parts);
        }
        return false;
    }, [isTransitioning, messages, status]);

    const clampScrollToFirstUser = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const first = el.querySelector<HTMLElement>("[data-first-user-anchor]");
        if (!first) return;
        const pad = 8;
        const elRect = el.getBoundingClientRect();
        const firstRect = first.getBoundingClientRect();
        const topInContent =
            firstRect.top - elRect.top + el.scrollTop;
        const minScroll = Math.max(0, topInContent - pad);
        if (el.scrollTop < minScroll) {
            el.scrollTop = minScroll;
        }
    }, []);

    const handleScroll = useCallback(
        (el: HTMLDivElement) => {
            const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 140;
            userScrolledUp.current = !nearBottom;
            if (clampRafRef.current != null) return;
            clampRafRef.current = requestAnimationFrame(() => {
                clampRafRef.current = null;
                clampScrollToFirstUser();
            });
        },
        [clampScrollToFirstUser]
    );

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const grew = messages.length !== lastLenRef.current;
        lastLenRef.current = messages.length;
        if (userScrolledUp.current && !grew && !isTransitioning) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (userScrolledUp.current && !grew && !isTransitioning) return;
                const anchor = el.querySelector<HTMLDivElement>(
                    '[data-last-user="true"]'
                );
                if (grew && anchor) {
                    anchor.scrollIntoView({ block: "start", behavior: "auto" });
                } else {
                    el.scrollTop = el.scrollHeight;
                }
                clampScrollToFirstUser();
            });
        });
    }, [messages, isStreaming, isTransitioning, clampScrollToFirstUser]);

    const showPendingBubble =
        Boolean(pendingUserText) && !messages.some((m) => m.role === "user");

    useEffect(() => {
        if (!showPendingBubble) return;
        const el = scrollRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const anchor = el.querySelector<HTMLElement>(
                    '[data-last-user="true"]'
                );
                if (anchor) {
                    anchor.scrollIntoView({ block: "start", behavior: "auto" });
                }
                clampScrollToFirstUser();
            });
        });
    }, [showPendingBubble, clampScrollToFirstUser]);

    return (
        <div
            ref={scrollRef}
            onScroll={(e) => handleScroll(e.currentTarget)}
            className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
            style={{ overflowAnchor: "none" }}
        >
            <div className="mx-auto flex w-full max-w-3xl flex-col space-y-0 px-4 pt-6 pb-[9.5rem] sm:px-6 sm:pt-8 sm:pb-44">
                {showPendingBubble && (
                    <div
                        className="mb-0 flex justify-end"
                        data-last-user="true"
                        data-first-user-anchor=""
                    >
                        <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl bg-white px-4 py-2.5 text-[15px] leading-relaxed text-black shadow-sm dark:bg-white/10 dark:text-[#D5D5D5]">
                            {pendingUserText}
                        </div>
                    </div>
                )}

                {messages.map((message, idx) => {
                    const isUser = message.role === "user";
                    const parts = Array.isArray(message.parts) ? message.parts : [];
                    const isLastMsg = idx === messages.length - 1;
                    const nextIsAssistant =
                        idx < messages.length - 1 &&
                        messages[idx + 1]?.role === "assistant";

                    const turnClass = isUser
                        ? nextIsAssistant
                            ? "mb-0"
                            : "mb-4"
                        : isLastMsg
                          ? "mb-0"
                          : "mb-8 border-b border-black/10 pb-6 dark:border-white/10";

                    if (isUser) {
                        const text = parts
                            .filter((p) => (p as { type?: string }).type === "text")
                            .map((p) => (p as { text?: string }).text ?? "")
                            .join("\n");
                        const isFirstUser = idx === firstUserIndex;
                        return (
                            <div
                                key={message.id}
                                data-last-user={
                                    idx === lastUserIndex ? "true" : undefined
                                }
                                data-first-user-anchor={isFirstUser ? "" : undefined}
                                className={`flex justify-end ${turnClass}`}
                            >
                                <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl bg-white px-4 py-2.5 text-[15px] leading-relaxed text-black shadow-sm dark:bg-white/10 dark:text-[#D5D5D5]">
                                    {text}
                                </div>
                            </div>
                        );
                    }

                    const showAssistantPlaceholder =
                        parts.length === 0 &&
                        isLastMsg &&
                        isStreaming &&
                        shouldShowBottomLoader;

                    const content = showAssistantPlaceholder ? null : (
                        partitionPartsForRender(parts).map((row) => {
                            if (row.kind === "reasoning") {
                                const isStreamingReasoning =
                                    isLastMsg &&
                                    isStreaming &&
                                    row.end === parts.length - 1;
                                return (
                                    <ReasoningPart
                                        key={`${message.id}-reasoning-${row.start}-${row.end}`}
                                        id={`${message.id}-reasoning-${row.start}`}
                                        text={row.text}
                                        isStreaming={isStreamingReasoning}
                                    />
                                );
                            }
                            const pIdx = row.index;
                            const part = parts[pIdx];
                            return (
                                <MessagePartRenderer
                                    key={`${message.id}-${pIdx}-${part.type}`}
                                    part={
                                        part as Parameters<
                                            typeof MessagePartRenderer
                                        >[0]["part"]
                                    }
                                    messageId={message.id}
                                    partIndex={pIdx}
                                    isStreaming={
                                        isLastMsg &&
                                        isStreaming &&
                                        pIdx === parts.length - 1
                                    }
                                />
                            );
                        })
                    );

                    return (
                        <div
                            key={message.id}
                            className={`flex w-full flex-col gap-3 text-black dark:text-[#D5D5D5] ${turnClass}`}
                        >
                            {content}
                        </div>
                    );
                })}

                {shouldShowBottomLoader && (
                    <div
                        className={`mt-1 flex items-start ${shouldReserveLoaderMinHeight ? "min-h-[calc(100vh-18rem)]" : ""}`}
                    >
                        <BouncingDots />
                    </div>
                )}
            </div>
        </div>
    );
});

function BouncingDots() {
    return (
        <div className="flex h-6 shrink-0 items-center gap-1.5 pl-0.5">
            <span className="size-2.5 animate-bounce rounded-full bg-black/40 dark:bg-[#D5D5D5]/40" />
            <span
                className="size-2.5 animate-bounce rounded-full bg-black/40 dark:bg-[#D5D5D5]/40"
                style={{ animationDelay: "150ms" }}
            />
            <span
                className="size-2.5 animate-bounce rounded-full bg-black/40 dark:bg-[#D5D5D5]/40"
                style={{ animationDelay: "300ms" }}
            />
        </div>
    );
}
