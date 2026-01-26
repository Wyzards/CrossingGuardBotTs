import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";

export const apiClient = new CrossroadsApiClient(
    process.env.CROSSROADS_API_URL!,
    process.env.CROSSROADS_API_TOKEN!);