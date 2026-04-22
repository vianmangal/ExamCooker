import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let cached: Ratelimit | null | undefined;

export function getStudyChatRatelimit(): Ratelimit | null {
    if (cached !== undefined) return cached;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        cached = null;
        return null;
    }
    cached = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(30, "60 s"),
        analytics: true,
        prefix: "ec:study:chat",
    });
    return cached;
}
