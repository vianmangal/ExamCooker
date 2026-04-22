import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
    title: "Study Assistant",
};

export default function StudyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
