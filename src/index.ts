import { getActiveBundlesJSON } from "./bundles";
import { createTimestampIndicator } from "./discord";
import { sendWebhook } from "./discord";
import webhook_template from "./discord/webhook_template.json";
import dotenv from "dotenv";
import { env } from "process";

dotenv.config();

function schedule() {
    getActiveBundlesJSON().then((response) => {
        for (const bundle_type of Object.keys(response.data)) {
            let webhook_path = "";
            switch (bundle_type) {
                case "games":
                    webhook_path = env.GAME_BUNDLE_WEBHOOK_PATH;
                    break;
                case "books":
                    webhook_path = env.BOOK_BUNDLE_WEBHOOK_PATH;
                    break;
                case "software":
                    webhook_path = env.SOFTWARE_BUNDLE_WEBHOOK_PATH;
                    break;
            }

            const product_json =
                response.data[bundle_type as keyof typeof response.data]
                    .mosaic[0].products[0];
            const modified_webhook_template = webhook_template;
            modified_webhook_template.embeds[0].title = product_json.tile_name;
            modified_webhook_template.embeds[0].url =
                "https://humblebundle.com" + product_json.product_url;
            modified_webhook_template.embeds[0]["fields"][0]["value"] = String(
                product_json["bundles_sold|decimal"],
            );
            modified_webhook_template.embeds[0]["fields"][1]["value"] =
                createTimestampIndicator(
                    product_json["start_date|datetime"],
                    "f",
                );
            modified_webhook_template.embeds[0]["fields"][2]["value"] =
                createTimestampIndicator(
                    product_json["end_date|datetime"],
                    "R",
                );
            modified_webhook_template.embeds[0].image.url =
                product_json.high_res_tile_image;

            sendWebhook(webhook_path, modified_webhook_template);
        }
    });
}

schedule();
setInterval(schedule, 3600000);
