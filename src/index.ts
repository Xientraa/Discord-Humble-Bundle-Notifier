import { getActiveBundlesJSON, getChoiceBundleJSON } from "./bundles";
import { createTimestampIndicator } from "./discord";
import { sendWebhook } from "./discord";
import webhook_template from "./discord/webhook_template.json";
import dotenv from "dotenv";
import { env } from "process";
import sqlite from "sqlite3";
import { SCHEDULE_LOGGER, DATABASE_LOGGER } from "./logger";

dotenv.config();

const database = new sqlite.Database("./database.sqlite");
database.run(
    "CREATE TABLE bundles (href TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL)",
    () => {},
);

function isBundleInDatabase(
    product_url: string,
    product_start_time: string,
    product_end_time: string,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        database.get(
            "SELECT * FROM bundles WHERE href=? AND start_date=? AND end_date=?",
            [product_url, product_start_time, product_end_time],
            (err, row) => {
                if (err) {
                    DATABASE_LOGGER.error(err);
                    return reject(err);
                }
                resolve(row !== undefined);
            },
        );
    });
}

function addBundleToDatabase(
    product_url: string,
    product_start_time: string,
    product_end_time: string,
): void {
    database.run(
        "INSERT INTO bundles VALUES(?, ?, ?)",
        [product_url, product_start_time, product_end_time],
        (err: Error) => {
            if (err) {
                DATABASE_LOGGER.error(err);
                return;
            }

            DATABASE_LOGGER.debug(
                `Successfully added href: "${product_url}", start_date: "${product_start_time}", end_date: "${product_end_time}" to the database.`,
            );
        },
    );
}

function schedule() {
    getActiveBundlesJSON().then((response) => {
        for (const bundle_type of Object.keys(response.data)) {
            let webhook_path = "";
            let username = "";
            switch (bundle_type) {
                case "games":
                    webhook_path = env.GAME_BUNDLE_WEBHOOK_PATH;
                    username = env.GAME_BUNDLE_USERNAME;
                    break;
                case "books":
                    webhook_path = env.BOOK_BUNDLE_WEBHOOK_PATH;
                    username = env.BOOK_BUNDLE_USERNAME;
                    break;
                case "software":
                    webhook_path = env.SOFTWARE_BUNDLE_WEBHOOK_PATH;
                    username = env.SOFTWARE_BUNDLE_USERNAME;
                    break;
            }

            for (const product_json of response.data[
                bundle_type as keyof typeof response.data
            ].mosaic[0].products) {
                const product_start_time = product_json["start_date|datetime"];
                const product_end_time = product_json["end_date|datetime"];
                const product_url = product_json.product_url;

                SCHEDULE_LOGGER.debug(
                    `Basic bundle information: {"name": "${product_json.tile_short_name}", "start_time": "${product_start_time}", "end_time": "${product_end_time}", "href": "${product_json.product_url}", "bundle_type": "${bundle_type}"}.`,
                );

                isBundleInDatabase(
                    product_url,
                    product_start_time,
                    product_end_time,
                )
                    .then((is_bundle_in_database) => {
                        if (is_bundle_in_database) {
                            SCHEDULE_LOGGER.debug(
                                `"${product_json.tile_short_name}" has already sent out a notification, skipping.`,
                            );
                            return;
                        }

                        const modified_webhook_template = webhook_template;
                        modified_webhook_template.embeds[0].title =
                            product_json.tile_name;
                        modified_webhook_template.embeds[0].description =
                            product_json.short_marketing_blurb.replaceAll(
                                // Replaces invalid characters which are unable to be used by a discord webhook
                                new RegExp("[^\\w\\d ]", "g"),
                                "",
                            );
                        modified_webhook_template.embeds[0].url =
                            "https://humblebundle.com" + product_url;

                        // Start date
                        modified_webhook_template.embeds[0]["fields"][0][
                            "value"
                        ] = createTimestampIndicator(product_start_time, "f");

                        // End date
                        modified_webhook_template.embeds[0]["fields"][1][
                            "value"
                        ] = createTimestampIndicator(product_end_time, "R");

                        // Amount of sales
                        modified_webhook_template.embeds[0]["fields"][2][
                            "value"
                        ] = String(
                            String(product_json["bundles_sold|decimal"]) ===
                                "undefined"
                                ? 0
                                : product_json["bundles_sold|decimal"],
                        );

                        modified_webhook_template.embeds[0].image.url =
                            product_json.high_res_tile_image;
                        modified_webhook_template.username = username;

                        SCHEDULE_LOGGER.info(
                            `Sending webhook request for: "${product_json.tile_short_name}".`,
                        );
                        sendWebhook(webhook_path, modified_webhook_template)
                            .then(() => {
                                SCHEDULE_LOGGER.info(
                                    `Webhook request has been successfully sent for: "${product_json.tile_short_name}".`,
                                );
                                addBundleToDatabase(
                                    product_url,
                                    product_start_time,
                                    product_end_time,
                                );
                            })
                            .catch((err) => {
                                SCHEDULE_LOGGER.error(err);
                            });
                    })
                    .catch((err) => {
                        SCHEDULE_LOGGER.error(err);
                    });
            }
        }
    });

    getChoiceBundleJSON().then((json) => {
        isBundleInDatabase(
            json.url,
            json.offers.validFrom,
            json.offers.validThrough,
        ).then((is_bundle_in_database) => {
            if (is_bundle_in_database) {
                SCHEDULE_LOGGER.debug(
                    `"${json.name}" has already sent out a notification, skipping.`,
                );
                return;
            }

            const modified_webhook_template = webhook_template;
            modified_webhook_template.embeds[0].title = json.name;
            modified_webhook_template.embeds[0].description = json.description;
            modified_webhook_template.embeds[0].url = json.url;

            // Start date
            modified_webhook_template.embeds[0]["fields"][0]["value"] =
                createTimestampIndicator(json.offers.validFrom, "f");

            // End date
            modified_webhook_template.embeds[0]["fields"][1]["value"] =
                createTimestampIndicator(json.offers.validThrough, "R");

            // Amount of sales
            modified_webhook_template.embeds[0]["fields"][2]["value"] =
                "Unknown";

            modified_webhook_template.embeds[0].image.url =
                json.image.replaceAll("&amp;", "&");
            modified_webhook_template.username = env.CHOICE_USERNAME;

            SCHEDULE_LOGGER.info(
                `Sending webhook request for: "${json.name}".`,
            );
            sendWebhook(env.CHOICE_WEBHOOK_PATH, modified_webhook_template)
                .then(() => {
                    SCHEDULE_LOGGER.info(
                        `Webhook request has been successfully sent for: "${json.name}".`,
                    );
                    addBundleToDatabase(
                        json.url,
                        json.offers.validFrom,
                        json.offers.validThrough,
                    );
                })
                .catch((err) => {
                    SCHEDULE_LOGGER.error(err);
                });
        });
    });
}

schedule();
setInterval(schedule, env.TRIGGER_INTERVAL || 3600000);
