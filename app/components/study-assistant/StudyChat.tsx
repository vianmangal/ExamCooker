"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { StudyScope } from "@/lib/study/scope";
import { StudyHeader } from "./StudyHeader";
import { StudyLanding } from "./StudyLanding";
import { StudyMessages } from "./StudyMessages";
import { StudyComposer } from "./StudyComposer";
import { getStudyChatMessagesAction } from "@/app/actions/studyChats";

function hasUserMessage(
    list: { role: string }[] | undefined
): boolean {
    return Boolean(list?.some((m) => m.role === "user"));
}

interface StudyChatProps {
    chatId: string;
    scope: StudyScope | null;
    scopeLabel: string | null;
    scopeSubtitle: string | null;
    onToggleSidebar: () => void;
    onClearScope: () => void;
    onChatUpdated: (info: { chatId: string; title?: string | null }) => void;
}

export function StudyChat({
    chatId,
    scope,
    scopeLabel,
    scopeSubtitle,
    onToggleSidebar,
    onClearScope,
    onChatUpdated,
}: StudyChatProps) {
    const [input, setInput] = useState("");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingUserText, setPendingUserText] = useState<string | null>(null);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/study/chat",
                prepareSendMessagesRequest: ({ messages, id, trigger, messageId }) => ({
                    body: {
                        id: id ?? chatId,
                        scope: scope ?? { type: "COURSE", code: "GENERAL" },
                        message: messages.at(-1),
                        trigger,
                        messageId,
                    },
                }),
            }),
        [chatId, scope]
    );

    const {
        messages,
        sendMessage,
        stop,
        status,
        setMessages,
        error,
        clearError,
    } = useChat({
        id: chatId,
        transport,
        onFinish: ({ message }) => {
            const text = extractUserText(message);
            onChatUpdated({ chatId, title: text?.slice(0, 60) ?? null });
        },
    });

    const isStreaming = status === "streaming" || status === "submitted";
    const isEmpty =
        messages.length === 0 &&
        !isTransitioning &&
        status === "ready";

    useEffect(() => {
        if (hasUserMessage(messages)) {
            setPendingUserText(null);
        }
    }, [messages]);

    useEffect(() => {
        if (error) {
            setIsTransitioning(false);
            setPendingUserText(null);
        }
    }, [error]);

    useEffect(() => {
        const last = messages[messages.length - 1];
        if (last?.role === "assistant") {
            setIsTransitioning(false);
        }
    }, [messages]);

    const hydratedChatIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (hydratedChatIdRef.current === chatId) return;
        hydratedChatIdRef.current = chatId;
        setMessages([]);
        setInput("");
        let cancelled = false;
        void getStudyChatMessagesAction(chatId)
            .then((list) => {
                if (cancelled) return;
                if (Array.isArray(list) && list.length) {
                    setMessages(
                        list.map((m) => ({
                            id: m.id,
                            role: m.role,
                            parts: Array.isArray(m.parts) ? m.parts : [],
                        }))
                    );
                }
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [chatId, setMessages]);

    const handleSend = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            setIsTransitioning(true);
            setPendingUserText(trimmed);
            clearError?.();
            void sendMessage({ text: trimmed });
            setInput("");
        },
        [clearError, sendMessage]
    );

    return (
        <div className="relative flex h-full min-h-0 flex-col">
            <StudyHeader
                scope={scope}
                scopeLabel={scopeLabel}
                scopeSubtitle={scopeSubtitle}
                onToggleSidebar={onToggleSidebar}
                onClearScope={onClearScope}
                compact={isEmpty}
            />

            {isEmpty ? (
                <div className="no-scrollbar relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-6">
                    <div className="mx-auto w-full max-w-2xl">
                        <StudyLanding
                            scope={scope}
                            scopeLabel={scopeLabel}
                            onSend={handleSend}
                            composer={
                                <StudyComposer
                                    value={input}
                                    onChange={setInput}
                                    onSend={() => handleSend(input)}
                                    onStop={() => stop()}
                                    isStreaming={isStreaming}
                                    placeholder={placeholderFor(scope)}
                                    variant="inline"
                                />
                            }
                        />

                        {error && (
                            <div className="mx-auto mt-4 max-w-lg rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                                {error.message || "something went wrong. please try again."}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <StudyMessages
                        messages={messages}
                        status={status}
                        isStreaming={isStreaming}
                        isTransitioning={isTransitioning}
                        pendingUserText={pendingUserText}
                    />

                    {error && (
                        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                            <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                                {error.message || "something went wrong. please try again."}
                            </div>
                        </div>
                    )}

                    <StudyComposer
                        value={input}
                        onChange={setInput}
                        onSend={() => handleSend(input)}
                        onStop={() => stop()}
                        isStreaming={isStreaming}
                        placeholder={placeholderFor(scope)}
                        variant="sticky"
                    />
                </>
            )}
        </div>
    );
}

function placeholderFor(scope: StudyScope | null): string {
    if (!scope) return "ask anything about your coursework…";
    if (scope.type === "NOTE") return "ask about this note…";
    if (scope.type === "PAST_PAPER") return "ask about this paper…";
    return "ask about this course…";
}

function extractUserText(message: {
    parts?: Array<{ type?: string; text?: string }>;
}): string | null {
    const parts = Array.isArray(message.parts) ? message.parts : [];
    for (const p of parts) {
        if (p?.type === "text" && p.text) return p.text;
    }
    return null;
}
