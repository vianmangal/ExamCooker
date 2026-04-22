import { tool, generateText, Output } from "ai";
import { z } from "zod";
import { study, STUDY_PROVIDER_OPTIONS } from "@/lib/ai/provider";
import type { ScopeContext } from "@/lib/study/scope";
import { fetchPdfAsBuffer } from "./pdf-fetch";

const quizSchema = z.object({
    title: z.string(),
    questions: z
        .array(
            z.object({
                id: z.string().describe("Short stable id like q1, q2."),
                question: z.string(),
                options: z
                    .array(z.object({ id: z.string(), text: z.string() }))
                    .length(4)
                    .describe("Exactly 4 options labeled a, b, c, d."),
                correctOptionId: z
                    .string()
                    .describe("One of a,b,c,d matching the correct option."),
                explanation: z
                    .string()
                    .describe("One to two sentences explaining why that answer is correct."),
            })
        )
        .min(3)
        .max(8),
});

export function createQuizMeTool(context: ScopeContext | null) {
    return tool({
        description:
            "Generate an inline multiple-choice quiz from the current document to help the student self-test. Use when the student says 'quiz me' or 'test me'.",
        inputSchema: z.object({
            topic: z
                .string()
                .optional()
                .describe("Optional topic focus (e.g. a chapter or concept)."),
            count: z.number().int().min(3).max(8).default(5),
        }),
        execute: async ({ topic, count }) => {
            const baseInstruction = [
                `Generate exactly ${count} multiple-choice questions to help a VIT student practice.`,
                topic ? `Focus on: ${topic}.` : "",
                "Each question has exactly 4 options with ids a, b, c, d. Distractors should be plausible but clearly wrong on close inspection.",
            ]
                .filter(Boolean)
                .join(" ");

            const fetched = context?.fileUrl
                ? await fetchPdfAsBuffer(context.fileUrl).catch(() => null)
                : null;

            const messages = fetched
                ? ([
                    {
                        role: "user" as const,
                        content: [
                            {
                                type: "text" as const,
                                text: `${baseInstruction} Source the questions from the attached PDF titled "${context!.title}".`,
                            },
                            {
                                type: "file" as const,
                                mediaType: "application/pdf",
                                data: fetched.data,
                                filename: context!.title ? `${context!.title}.pdf` : "document.pdf",
                            },
                        ],
                    },
                ])
                : ([
                    {
                        role: "user" as const,
                        content: `${baseInstruction} Source: course "${context?.courseCode ?? "general"}".`,
                    },
                ]);

            const { output } = await generateText({
                model: study.languageModel("quiz"),
                providerOptions: STUDY_PROVIDER_OPTIONS,
                output: Output.object({ schema: quizSchema }),
                messages,
            });
            return output;
        },
    });
}
