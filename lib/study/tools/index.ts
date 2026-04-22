import type { ScopeContext } from "@/lib/study/scope";
import { study } from "@/lib/ai/provider";
import { createSummarizeDocumentTool } from "./summarize-document";
import { createQuizMeTool } from "./quiz-me";
import { createExplainConceptTool } from "./explain-concept";
import { createSearchPastPapersTool } from "./search-past-papers";
import { createSearchNotesTool } from "./search-notes";
import { createGetCourseOverviewTool } from "./get-course-overview";
import { createGetSyllabusTool } from "./get-syllabus";
import { createSearchForumTool } from "./search-forum";

export interface LoadStudyToolsOptions {
    context: ScopeContext | null;
    userId: string;
}

export function loadStudyTools({ context, userId }: LoadStudyToolsOptions) {
    return {
        image_generation: study.imageGenerationTool(),
        summarize_document: createSummarizeDocumentTool(context),
        quiz_me: createQuizMeTool(context),
        explain_concept: createExplainConceptTool(context),
        search_past_papers: createSearchPastPapersTool(context),
        search_notes: createSearchNotesTool(context),
        get_course_overview: createGetCourseOverviewTool(context),
        get_syllabus: createGetSyllabusTool(context),
        search_forum: createSearchForumTool(context, userId),
    };
}
