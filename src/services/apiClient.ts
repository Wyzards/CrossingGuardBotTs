import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";

let instance: CrossroadsApiClient | null = null;

export function getApiClient(): CrossroadsApiClient {
    if (!instance) {
        const url = process.env.CROSSROADS_API_URL!;
        const token = process.env.CROSSROADS_API_TOKEN!;

        if (!url || !token) {
            throw new Error("CROSSROADS_API_URL or CROSSROADS_API_TOKEN not set");
        }
        instance = new CrossroadsApiClient(url, token);
    }
    return instance;
}
