import prisma from "@/lib/prisma";
import type { StudyScope } from "./scope";
import type { UIMessage } from "ai";

interface EnsureChatInput {
    chatId?: string;
    userId: string;
    scope: StudyScope;
    firstUserText?: string;
}

export async function ensureStudyChat({
    chatId,
    userId,
    scope,
    firstUserText,
}: EnsureChatInput) {
    if (chatId) {
        const existing = await prisma.studyChat.findFirst({
            where: { id: chatId, userId },
        });
        if (existing) return existing;
    }

    const title = firstUserText
        ? firstUserText.slice(0, 80).replace(/\s+/g, " ").trim()
        : scope.type === "COURSE"
            ? `${scope.code} study`
            : "study chat";

    return prisma.studyChat.create({
        data: {
            id: chatId,
            userId,
            scope: scope.type,
            noteId: scope.type === "NOTE" ? scope.id : null,
            pastPaperId: scope.type === "PAST_PAPER" ? scope.id : null,
            courseCode: scope.type === "COURSE" ? scope.code : null,
            title,
        },
    });
}

export async function loadStudyChatMessages({
    chatId,
    userId,
    take = 24,
}: {
    chatId: string;
    userId: string;
    take?: number;
}): Promise<UIMessage[]> {
    const chat = await prisma.studyChat.findFirst({
        where: { id: chatId, userId },
        select: {
            messages: {
                orderBy: { createdAt: "desc" },
                take,
                select: {
                    id: true,
                    role: true,
                    parts: true,
                },
            },
        },
    });

    return (chat?.messages ?? [])
        .reverse()
        .map((message) => ({
            id: message.id,
            role: message.role as UIMessage["role"],
            parts: (Array.isArray(message.parts) ? message.parts : []) as UIMessage["parts"],
        }));
}

export async function persistStudyTurn({
    chatId,
    userMessage,
    assistantMessage,
}: {
    chatId: string;
    userMessage?: { id: string; parts: unknown };
    assistantMessage?: { id: string; parts: unknown };
}) {
    if (userMessage) {
        await prisma.studyMessage.upsert({
            where: { id: userMessage.id },
            create: {
                id: userMessage.id,
                chatId,
                role: "user",
                parts: userMessage.parts as never,
            },
            update: {},
        });
    }
    if (assistantMessage) {
        await prisma.studyMessage.upsert({
            where: { id: assistantMessage.id },
            create: {
                id: assistantMessage.id,
                chatId,
                role: "assistant",
                parts: assistantMessage.parts as never,
            },
            update: {
                parts: assistantMessage.parts as never,
            },
        });
    }
    await prisma.studyChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
    });
}
