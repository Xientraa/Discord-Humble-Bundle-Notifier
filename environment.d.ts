declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GAME_BUNDLE_USERNAME: string;
            GAME_BUNDLE_WEBHOOK_PATH: string;
            BOOK_BUNDLE_USERNAME: string;
            BOOK_BUNDLE_WEBHOOK_PATH: string;
            SOFTWARE_BUNDLE_USERNAME: string;
            SOFTWARE_BUNDLE_WEBHOOK_PATH: string;
            CHOICE_USERNAME: string;
            CHOICE_WEBHOOK_PATH: string;
            TRIGGER_INTERVAL: number | undefined;
        }
    }
}

export {};
