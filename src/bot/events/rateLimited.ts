import { RESTEvents, RateLimitData } from "discord.js";


const name = RESTEvents.RateLimited;
const execute = async function (rateLimitData: RateLimitData) {
    console.log(rateLimitData);
}

export {
    name, execute
}