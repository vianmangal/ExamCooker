import { tool, generateText, Output } from "ai";
import { z } from "zod";
import { study, STUDY_PROVIDER_OPTIONS } from "@/lib/ai/provider";
import type { ScopeContext } from "@/lib/study/scope";
import { fetchPdfAsBuffer } from "./pdf-fetch";

const summarySchema = z.object({
    title: z.string(),
    tldr: z.string().describe("2-3 sentence high-level summary."),
    sections: z
        .array(
            z.object({
                heading: z.string(),
                bullets: z.array(z.string()).min(1).max(6),
            })
        )
        .min(2)
        .max(6),
    keyTerms: z.array(z.string()).max(10).default([]),
});

export function createSummarizeDocumentTool(context: ScopeContext | null) {
    return tool({
        description:
            "Summarize the currently-open document into TL;DR + section bullets + key terms. Only use when the user asks for a summary/overview. Do NOT call this repeatedly in a turn.",
        inputSchema: z.object({}).describe("No arguments needed."),
        execute: async () => {
            if (!context?.fileUrl) {
                return { error: "no document in context" };
            }
            const fetched = await fetchPdfAsBuffer(context.fileUrl).catch(() => null);
            if (!fetched) {
                return { error: "couldn't fetch document" };
            }
            const { output } = await generateText({
                model: study.languageModel("summary"),
                providerOptions: STUDY_PROVIDER_OPTIONS,
                output: Output.object({ schema: summarySchema }),
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Summarize the attached PDF titled "${context.title}" for a VIT student. Return a concise, study-ready outline.`,
                            },
                            {
                                type: "file",
                                mediaType: "application/pdf",
                                data: fetched.data,
                                filename: context.title ? `${context.title}.pdf` : "document.pdf",
                            },
                        ],
                    },
                ],
            });
            return output;
        },
    });
}
