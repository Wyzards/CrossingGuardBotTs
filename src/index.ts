import dotenv from 'dotenv';
import { loadConfig } from './core/loadConfig.js';
import { Bot } from './bot/Bot.js';
dotenv.config({ quiet: true });

const config = loadConfig();
const bot = new Bot(config);