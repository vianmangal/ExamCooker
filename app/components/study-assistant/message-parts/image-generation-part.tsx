"use client";

import { memo } from "react";
import { ToolShell, type ToolState } from "./tool-shell";
import { ToolLoading } from "./tool-loading";

export interface ImageGenerationOutput {
    result?: string;
}

interface ImageGenerationPartProps {
    state: ToolState;
    output?: ImageGenerationOutput | unknown;
    errorText?: string;
}

export const ImageGenerationPart = memo(function ImageGenerationPart({
    state,
    output,
    errorText,
}: ImageGenerationPartProps) {
    if (state === "input-streaming" || state === "input-available") {
        return <ToolLoading label="Generating image" />;
    }

    const data = (output as ImageGenerationOutput | null) ?? null;
    const src = data?.result ? toImageDataUrl(data.result) : null;

    return (
        <ToolShell
            toolName="image_generation"
            label="Generated image"
            state={state}
            errorText={errorText}
            defaultOpen
        >
            {src ? (
                <div className="overflow-hidden rounded-lg border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]">
                    <img
                        src={src}
                        alt="AI generated image"
                        className="block h-auto w-full object-contain"
                    />
                </div>
            ) : (
                <p className="text-[12px] text-black/55 dark:text-[#D5D5D5]/55">
                    No image data was returned.
                </p>
            )}
        </ToolShell>
    );
});

function toImageDataUrl(value: string): string {
    if (value.startsWith("data:")) return value;
    return `data:image/webp;base64,${value}`;
}
