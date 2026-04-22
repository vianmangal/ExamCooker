"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StudyScope } from "@/lib/study/scope";

interface AskTutorButtonProps {
    scope: StudyScope;
    label?: string;
}

function buildStudyHref(scope: StudyScope) {
    const params = new URLSearchParams({ scope: scope.type });
    if (scope.type === "COURSE") params.set("code", scope.code);
    else params.set("id", scope.id);
    return `/study?${params.toString()}`;
}

/**
 * Quiet entry point on document pages — a small pill bottom-right that
 * navigates into the /study experience with the current scope preloaded.
 */
export function AskTutorButton({ scope, label }: AskTutorButtonProps) {
    const href = buildStudyHref(scope);
    return (
        <Link
            href={href}
            aria-label={label ? `open tutor for ${label}` : "open tutor"}
            className="group fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[13px] font-medium text-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#111826] dark:text-[#D5D5D5] lg:bottom-6 lg:right-6"
        >
            <span>ask the tutor</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-black/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-white/40" />
        </Link>
    );
}
