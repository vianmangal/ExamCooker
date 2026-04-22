import { tool } from "ai";
import { z } from "zod";
import { getForumPage } from "@/lib/data/forum";
import { normalizeCourseCode } from "@/lib/courseTags";
import type { ScopeContext } from "@/lib/study/scope";

export function createSearchForumTool(context: ScopeContext | null, userId: string) {
    return tool({
        description:
            "Search the ExamCooker forum for student discussions on a topic, concept, or course. Returns recent threads with title, snippet, and vote counts. Use when the user wants real student perspectives or common doubts on a topic.",
        inputSchema: z.object({
            query: z.string().min(2).describe("What to search for."),
            courseCode: z
                .string()
                .optional()
                .describe("Optional course code to scope the search."),
            limit: z.number().int().min(1).max(8).default(6),
        }),
        execute: async ({ query, courseCode, limit }) => {
            const normalizedCourse = courseCode
                ? normalizeCourseCode(courseCode)
                : context?.courseCode ?? null;
            const searchParts = [query, normalizedCourse].filter(Boolean) as string[];
            const posts = await getForumPage({
                search: searchParts.join(" ").trim(),
                tags: [],
                page: 1,
                pageSize: limit,
                currentUserId: userId,
            });

            return {
                query,
                items: posts.map((p) => ({
                    id: p.id,
                    title: p.title,
                    href: `/forum/${p.id}`,
                    snippet: (p.description ?? "").slice(0, 200),
                    author: p.author?.name ?? "Unknown",
                    upvotes: p.upvoteCount,
                    downvotes: p.downvoteCount,
                    commentCount: p._count.comments,
                    createdAt: p.createdAt.toISOString(),
                })),
                total: posts.length,
            };
        },
    });
}
