"use client";

import { memo } from "react";
import { Streamdown } from "streamdown";
import { streamdownPlugins } from "@/lib/streamdown-config";

interface TextPartProps {
    id: string;
    text: string;
    isStreaming?: boolean;
}

export const TextPart = memo(function TextPart({
    id,
    text,
    isStreaming,
}: TextPartProps) {
    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none font-sans text-[15px] leading-relaxed text-black dark:text-[#D5D5D5]">
            <Streamdown
                key={id}
                mode={isStreaming ? "streaming" : "static"}
                isAnimating={!!isStreaming}
                plugins={streamdownPlugins}
            >
                {text}
            </Streamdown>
        </div>
    );
});
