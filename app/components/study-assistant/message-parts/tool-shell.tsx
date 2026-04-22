"use client";

import { memo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type ToolState =
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error"
    | "approval-requested";

interface ToolShellProps {
    toolName: string;
    label?: string;
    state: ToolState;
    headerExtra?: ReactNode;
    children?: ReactNode;
    errorText?: string;
    defaultOpen?: boolean;
}

export const ToolShell = memo(function ToolShell({
    toolName,
    label,
    state,
    headerExtra,
    children,
    errorText,
    defaultOpen = true,
}: ToolShellProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="my-2 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
            >
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-black dark:text-[#D5D5D5]">
                        {label ?? toolName.replaceAll("_", " ")}
                    </p>
                    {headerExtra && (
                        <p className="mt-0.5 truncate text-[11px] text-black/50 dark:text-[#D5D5D5]/50">
                            {headerExtra}
                        </p>
                    )}
                </div>
                {state === "output-error" && (
                    <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">
                        error
                    </span>
                )}
                {open ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-black/40 dark:text-[#D5D5D5]/40" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-black/40 dark:text-[#D5D5D5]/40" />
                )}
            </button>

            {open && (
                <div className="border-t border-black/5 p-3.5 dark:border-white/5">
                    {state === "output-error" && errorText ? (
                        <pre className="whitespace-pre-wrap rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-300">
                            {errorText}
                        </pre>
                    ) : (
                        children
                    )}
                </div>
            )}
        </div>
    );
});
