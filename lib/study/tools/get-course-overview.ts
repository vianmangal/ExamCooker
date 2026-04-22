import { tool } from "ai";
import { z } from "zod";
import { getCourseByCodeAny } from "@/lib/data/courses";
import { getCourseExamCounts } from "@/lib/data/courseExams";
import { getSyllabusByCourseCode } from "@/lib/data/syllabus";
import { normalizeCourseCode } from "@/lib/courseTags";
import prisma from "@/lib/prisma";
import type { ScopeContext } from "@/lib/study/scope";

export function createGetCourseOverviewTool(context: ScopeContext | null) {
    return tool({
        description:
            "Get a full ExamCooker overview for a course: course title, available syllabus, counts of past papers by exam type (CAT-1, CAT-2, FAT), and the most recent notes and papers. Use this when the user asks 'what is available for course X' or wants to see everything at once.",
        inputSchema: z.object({
            courseCode: z
                .string()
                .optional()
                .describe("Course code like 'BCSE304L'. Leave blank to use the course already in scope."),
        }),
        execute: async ({ courseCode }) => {
            const code = courseCode
                ? normalizeCourseCode(courseCode)
                : context?.courseCode ?? null;
            if (!code) {
                return { error: "No course code in scope. Ask the user for one." };
            }

            const course = await getCourseByCodeAny(code);
            if (!course) {
                return { error: `No course found for '${code}'.` };
            }

            const [examCounts, syllabus, notes, papers] = await Promise.all([
                getCourseExamCounts(course.tagIds),
                getSyllabusByCourseCode(course.code),
                prisma.note.findMany({
                    where: {
                        isClear: true,
                        tags: { some: { id: { in: course.tagIds } } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: { id: true, title: true },
                }),
                prisma.pastPaper.findMany({
                    where: {
                        isClear: true,
                        tags: { some: { id: { in: course.tagIds } } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: { id: true, title: true },
                }),
            ]);

            return {
                course: {
                    code: course.code,
                    title: course.title,
                    href: `/courses/${course.code}`,
                },
                examCounts: examCounts.map((e) => ({
                    slug: e.slug,
                    label: e.label,
                    count: e.count,
                })),
                syllabus: syllabus
                    ? { id: syllabus.id, name: syllabus.name, href: `/syllabus/${syllabus.id}` }
                    : null,
                recentNotes: notes.map((n) => ({
                    id: n.id,
                    title: n.title,
                    href: `/notes/${n.id}`,
                })),
                recentPapers: papers.map((p) => ({
                    id: p.id,
                    title: p.title,
                    href: `/past_papers/${p.id}`,
                })),
            };
        },
    });
}
