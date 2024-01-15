import { RESTEvents, RateLimitData } from "discord.js";


module.exports = {
    name: RESTEvents.RateLimited,
    execute(rateLimitData: RateLimitData) {
        console.log(rateLimitData);
    }
}