import { tool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { normalizeCourseCode } from "@/lib/courseTags";
import { normalizeGcsUrl } from "@/lib/normalizeGcsUrl";
import type { ScopeContext } from "@/lib/study/scope";
import type { Prisma } from "@/src/generated/prisma";

const EXAM_TYPES = ["CAT-1", "CAT-2", "FAT"] as const;
const SLOTS = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"] as const;

export function createSearchPastPapersTool(context: ScopeContext | null) {
    return tool({
        description:
            "Search ExamCooker's past-paper archive. Always prefer this over guessing. Supports filters for course code, exam type (CAT-1, CAT-2, FAT), slot (A1..G2), and year. Returns up to 8 of the best matches with direct links the student can open.",
        inputSchema: z.object({
            query: z
                .string()
                .optional()
                .describe("Free-text search over paper titles and tags."),
            courseCode: z
                .string()
                .optional()
                .describe(
                    "Course code like 'BCSE304L' or 'CSE1001'. If the active scope already has a course code and the user doesn't mention another, leave blank and it will be used automatically."
                ),
            examType: z
                .enum(EXAM_TYPES)
                .optional()
                .describe("Restrict to CAT-1, CAT-2, or FAT."),
            slot: z
                .enum(SLOTS)
                .optional()
                .describe("Restrict to a specific slot."),
            year: z
                .string()
                .regex(/^20\d{2}$/)
                .optional()
                .describe("Restrict to a four-digit year like 2024."),
            limit: z.number().int().min(1).max(8).default(6),
        }),
        execute: async ({ query, courseCode, examType, slot, year, limit }) => {
            const normalizedCourse = courseCode
                ? normalizeCourseCode(courseCode)
                : context?.courseCode ?? null;
            const normalizedSlot = slot?.toUpperCase();
            const trimmedQuery = query?.trim() ?? "";

            const runSearch = async (options: {
                includeExamFilters: boolean;
                includeQuery: boolean;
            }) => {
                const andConditions: Prisma.PastPaperWhereInput[] = [];

                const courseVariants = buildCourseCodeVariants(normalizedCourse);
                if (courseVariants.length > 0) {
                    andConditions.push({
                        OR: courseVariants.flatMap((variant) => [
                            { title: { contains: variant, mode: "insensitive" } },
                            {
                                tags: {
                                    some: {
                                        name: { contains: variant, mode: "insensitive" },
                                    },
                                },
                            },
                        ]),
                    });
                }

                if (options.includeQuery && trimmedQuery) {
                    andConditions.push({
                        OR: [
                            { title: { contains: trimmedQuery, mode: "insensitive" } },
                            {
                                tags: {
                                    some: {
                                        name: { contains: trimmedQuery, mode: "insensitive" },
                                    },
                                },
                            },
                        ],
                    });
                }

                if (options.includeExamFilters) {
                    if (examType) {
                        andConditions.push({
                            OR: [
                                { title: { contains: examType, mode: "insensitive" } },
                                {
                                    tags: {
                                        some: { name: { equals: examType, mode: "insensitive" } },
                                    },
                                },
                            ],
                        });
                    }

                    if (normalizedSlot) {
                        andConditions.push({
                            OR: [
                                { title: { contains: normalizedSlot, mode: "insensitive" } },
                                {
                                    tags: {
                                        some: { name: { equals: normalizedSlot, mode: "insensitive" } },
                                    },
                                },
                            ],
                        });
                    }

                    if (year) {
                        andConditions.push({
                            OR: [
                                { title: { contains: year, mode: "insensitive" } },
                                {
                                    tags: {
                                        some: { name: { contains: year, mode: "insensitive" } },
                                    },
                                },
                            ],
                        });
                    }
                }

                const where: Prisma.PastPaperWhereInput = {
                    isClear: true,
                    ...(andConditions.length ? { AND: andConditions } : {}),
                };

                return prisma.pastPaper.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    select: {
                        id: true,
                        title: true,
                        thumbNailUrl: true,
                    },
                });
            };

            let items = await runSearch({
                includeExamFilters: true,
                includeQuery: true,
            });

            const usedFallback =
                items.length === 0 && Boolean(examType || normalizedSlot || year);
            if (usedFallback) {
                items = await runSearch({
                    includeExamFilters: false,
                    includeQuery: true,
                });
            }

            const usedCourseOnlyFallback =
                items.length === 0 && Boolean(normalizedCourse && trimmedQuery);
            if (usedCourseOnlyFallback) {
                items = await runSearch({
                    includeExamFilters: false,
                    includeQuery: false,
                });
            }

            return {
                query: trimmedQuery || null,
                filters: {
                    courseCode: normalizedCourse,
                    examType: examType ?? null,
                    slot: normalizedSlot ?? null,
                    year: year ?? null,
                },
                items: items.map((p) => ({
                    id: p.id,
                    title: p.title,
                    href: `/past_papers/${p.id}`,
                    thumbnail: normalizeGcsUrl(p.thumbNailUrl) ?? p.thumbNailUrl ?? null,
                    type: "past_paper" as const,
                })),
                total: items.length,
                fallbackApplied: usedFallback || usedCourseOnlyFallback,
            };
        },
    });
}

function buildCourseCodeVariants(code: string | null): string[] {
    if (!code) return [];
    const compact = normalizeCourseCode(code);
    const match = compact.match(/^([A-Z]+)(\d+)([A-Z]*)$/);
    if (!match) return [compact];
    const [, prefix, digits, suffix] = match;
    const spaced = `${prefix} ${digits}${suffix}`;
    return [compact, spaced];
}
