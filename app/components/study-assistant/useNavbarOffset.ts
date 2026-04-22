"use client";

import { useEffect, useState } from "react";

export function useNavbarOffset(): number {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const nav = document.querySelector<HTMLElement>("body nav");
        if (!nav) {
            setOffset(0);
            return;
        }

        setOffset(Math.round(nav.getBoundingClientRect().width));

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setOffset(Math.round(entry.contentRect.width));
            }
        });
        ro.observe(nav);

        const mo = new MutationObserver(() => {
            const current = document.querySelector<HTMLElement>("body nav");
            if (!current) {
                setOffset(0);
                return;
            }
            setOffset(Math.round(current.getBoundingClientRect().width));
        });
        mo.observe(document.body, { childList: true, subtree: true });

        return () => {
            ro.disconnect();
            mo.disconnect();
        };
    }, []);

    return offset;
}
