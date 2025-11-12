import log4js from "log4js";
import { env } from "process";

log4js.configure({
    appenders: {
        file: { type: "file", filename: "logs.log" },
        console: { type: "console" },
    },
    categories: {
        default: {
            appenders: ["file", "console"],
            level: env.LOG_LEVEL || "info",
        },
    },
});

export const SCHEDULE_LOGGER = log4js.getLogger("schedule()");
export const DATABASE_LOGGER = log4js.getLogger("database");
