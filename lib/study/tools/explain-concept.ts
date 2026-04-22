import { tool, generateText } from "ai";
import { z } from "zod";
import { study, STUDY_PROVIDER_OPTIONS } from "@/lib/ai/provider";
import type { ScopeContext } from "@/lib/study/scope";

export function createExplainConceptTool(context: ScopeContext | null) {
    return tool({
        description:
            "Explain a concept clearly with a worked example. Use when the user asks to understand a specific topic, equation, or idea. If the user pastes a selection from a document they want explained, pass it as `selectionText`.",
        inputSchema: z.object({
            concept: z
                .string()
                .min(2)
                .describe("The concept or topic the user wants explained."),
            selectionText: z
                .string()
                .max(4000)
                .optional()
                .describe(
                    "Optional excerpt the user pasted or highlighted from the current document."
                ),
            level: z
                .enum(["beginner", "intermediate", "advanced"])
                .default("intermediate"),
        }),
        execute: async ({ concept, selectionText, level }) => {
            const contextLine = context?.title
                ? `The user is studying "${context.title}".`
                : "";
            const prompt = [
                contextLine,
                `Explain the concept: ${concept}.`,
                `Target level: ${level}. Use plain language, avoid jargon, and include a concrete example.`,
                "Use LaTeX for math via $...$ or $$...$$. Use markdown for structure: a short opening, 2 to 4 bullet points, and one worked example at the end.",
                selectionText ? `The user pasted this excerpt:\n---\n${selectionText}\n---` : "",
            ]
                .filter(Boolean)
                .join("\n\n");

            const { text } = await generateText({
                model: study.languageModel("default"),
                providerOptions: STUDY_PROVIDER_OPTIONS,
                prompt,
            });
            return { concept, level, selectionText: selectionText ?? null, explanation: text };
        },
    });
}
