declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GAME_BUNDLE_USERNAME: string;
            GAME_BUNDLE_WEBHOOK_PATH: string;
            BOOK_BUNDLE_USERNAME: string;
            BOOK_BUNDLE_WEBHOOK_PATH: string;
            SOFTWARE_BUNDLE_USERNAME: string;
            SOFTWARE_BUNDLE_WEBHOOK_PATH: string;
        }
    }
}

export {};
