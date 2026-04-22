"use client";

import { useMemo } from "react";

interface ToolLoadingProps {
    label: string;
}

export function ToolLoading({ label }: ToolLoadingProps) {
    const barWidths = useMemo(
        () =>
            [0, 1, 2].map(() => `${Math.round(Math.random() * 40 + 30)}px`),
        []
    );

    return (
        <div
            className="border-trail-wrapper relative my-2 h-[100px] w-full overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5"
            style={{ "--trail-color": "#4db3d6" } as React.CSSProperties}
        >
            <div className="flex h-full items-center gap-3 px-5">
                <div className="space-y-2">
                    <div className="text-shimmer text-[15px] font-medium">{label}</div>
                    <div className="flex gap-2">
                        {barWidths.map((w, i) => (
                            <div
                                key={i}
                                className="h-1.5 animate-pulse rounded-full bg-black/10 dark:bg-white/15"
                                style={{ width: w, animationDelay: `${i * 0.2}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
