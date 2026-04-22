import { openai } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-5.4-mini";
const SUMMARY_MODEL = "gpt-5.4-mini";
const QUIZ_MODEL = "gpt-5.4-mini";

type StudyModelName = "default" | "summary" | "quiz";

const MODEL_IDS: Record<StudyModelName, string> = {
    default: DEFAULT_MODEL,
    summary: SUMMARY_MODEL,
    quiz: QUIZ_MODEL,
};

export const study = {
    languageModel(name: StudyModelName) {
        return openai.responses(MODEL_IDS[name]);
    },
    imageGenerationTool() {
        return openai.tools.imageGeneration({
            model: "gpt-image-2",
            outputFormat: "webp",
            quality: "medium",
            size: "1024x1024",
        });
    },
};

export const STUDY_PROVIDER_OPTIONS = {
    openai: {
        reasoningSummary: "auto" as const,
        reasoningEffort: "low" as const,
    },
};

export const STUDY_MODELS = {
    default: "default" as const,
    summary: "summary" as const,
    quiz: "quiz" as const,
};
