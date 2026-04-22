/**
 * Fetch a remote PDF and return the bytes — used by the summarize and quiz
 * tools so they can pass `data: Uint8Array` file parts to models that don't
 * accept URL-form file parts (notably OpenAI via Chat Completions).
 */
export interface FetchedPdf {
    data: Uint8Array;
    mediaType: string;
}

const PDF_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED_PDF_BYTES = 20 * 1024 * 1024;
const pdfCache = new Map<string, { expiresAt: number; value: FetchedPdf }>();

export async function fetchPdfAsBuffer(url: string): Promise<FetchedPdf> {
    const now = Date.now();
    const cached = pdfCache.get(url);
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }
    if (cached) {
        pdfCache.delete(url);
    }

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`failed to fetch PDF (${res.status})`);
    }
    const mediaType =
        res.headers.get("content-type")?.split(";")[0]?.trim() ||
        "application/pdf";
    const value = {
        data: new Uint8Array(await res.arrayBuffer()),
        mediaType,
    };
    if (value.data.byteLength <= MAX_CACHED_PDF_BYTES) {
        pdfCache.set(url, {
            expiresAt: now + PDF_CACHE_TTL_MS,
            value,
        });
    }
    return value;
}
