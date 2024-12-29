import env from "dotenv";
env.config();
import { initializeBot } from "./telegram/tgBot";
import { migration } from "./database/migration";

migration();
initializeBot();
