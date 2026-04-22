"use server";

import { auth } from "@/app/auth";
import prisma from "@/lib/prisma";

export interface StudyChatSummaryDTO {
    id: string;
    title: string;
    scope: "NOTE" | "PAST_PAPER" | "COURSE";
    createdAt: string;
    updatedAt: string;
    context:
        | { type: "NOTE"; id?: string | null; title?: string | null }
        | { type: "PAST_PAPER"; id?: string | null; title?: string | null }
        | { type: "COURSE"; code?: string | null; title?: string | null };
}

export interface StudyChatMessageDTO {
    id: string;
    role: "user" | "assistant";
    parts: unknown;
    createdAt: string;
}

export async function listStudyChatsAction(limit = 80): Promise<StudyChatSummaryDTO[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const chats = await prisma.studyChat.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: safeLimit,
        select: {
            id: true,
            title: true,
            scope: true,
            noteId: true,
            pastPaperId: true,
            courseCode: true,
            createdAt: true,
            updatedAt: true,
            note: { select: { id: true, title: true } },
            pastPaper: { select: { id: true, title: true } },
        },
    });

    return chats.map((c) => ({
        id: c.id,
        title: c.title ?? "Untitled chat",
        scope: c.scope,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        context:
            c.scope === "NOTE"
                ? { type: "NOTE", id: c.noteId, title: c.note?.title }
                : c.scope === "PAST_PAPER"
                    ? { type: "PAST_PAPER", id: c.pastPaperId, title: c.pastPaper?.title }
                    : { type: "COURSE", code: c.courseCode, title: c.courseCode },
    }));
}

export async function getStudyChatMessagesAction(chatId: string): Promise<StudyChatMessageDTO[]> {
    const session = await auth();
    if (!session?.user?.id) return [];

    const chat = await prisma.studyChat.findFirst({
        where: { id: chatId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) return [];

    return chat.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: m.parts,
        createdAt: m.createdAt.toISOString(),
    }));
}

export async function renameStudyChatAction(chatId: string, title: string): Promise<{ ok: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };

    const nextTitle = title.trim();
    if (!nextTitle || nextTitle.length > 100) return { ok: false };

    const updated = await prisma.studyChat.updateMany({
        where: { id: chatId, userId: session.user.id },
        data: { title: nextTitle },
    });
    return { ok: updated.count > 0 };
}

export async function deleteStudyChatAction(chatId: string): Promise<{ ok: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };

    await prisma.studyChat.deleteMany({
        where: { id: chatId, userId: session.user.id },
    });
    return { ok: true };
}
