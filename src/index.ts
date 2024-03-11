import { getActiveBundlesJSON, getChoiceBundleJSON } from "./bundles";
import { createTimestampIndicator } from "./discord";
import { sendWebhook } from "./discord";
import webhook_template from "./discord/webhook_template.json";
import dotenv from "dotenv";
import { env } from "process";
import sqlite from "sqlite3";

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
                console.error(err);
            }
        },
    );
}

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

            for (const product_json of response.data[
                bundle_type as keyof typeof response.data
            ].mosaic[0].products) {
                const product_start_time = product_json["start_date|datetime"];
                const product_end_time = product_json["end_date|datetime"];
                const product_url = product_json.product_url;
                isBundleInDatabase(
                    product_url,
                    product_start_time,
                    product_end_time,
                )
                    .then((is_bundle_in_database) => {
                        if (is_bundle_in_database) {
                            return;
                        }

                        const modified_webhook_template = webhook_template;
                        modified_webhook_template.embeds[0].title =
                            product_json.tile_name;
                        modified_webhook_template.embeds[0].url =
                            "https://humblebundle.com" + product_url;
                        modified_webhook_template.embeds[0]["fields"][0][
                            "value"
                        ] = String(product_json["bundles_sold|decimal"]);
                        modified_webhook_template.embeds[0]["fields"][1][
                            "value"
                        ] = createTimestampIndicator(product_start_time, "f");
                        modified_webhook_template.embeds[0]["fields"][2][
                            "value"
                        ] = createTimestampIndicator(product_end_time, "R");
                        modified_webhook_template.embeds[0].image.url =
                            product_json.high_res_tile_image;

                        sendWebhook(webhook_path, modified_webhook_template)
                            .then(() => {
                                addBundleToDatabase(
                                    product_url,
                                    product_start_time,
                                    product_end_time,
                                );
                            })
                            .catch((err) => {
                                console.error(err);
                            });
                    })
                    .catch((err) => {
                        console.error(err);
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
                return;
            }

            const modified_webhook_template = webhook_template;
            modified_webhook_template.embeds[0].title = json.name;
            modified_webhook_template.embeds[0].url = json.url;
            modified_webhook_template.embeds[0]["fields"][0]["value"] =
                "unknown";
            modified_webhook_template.embeds[0]["fields"][1]["value"] =
                createTimestampIndicator(json.offers.validFrom, "f");
            modified_webhook_template.embeds[0]["fields"][2]["value"] =
                createTimestampIndicator(json.offers.validThrough, "R");
            modified_webhook_template.embeds[0].image.url =
                json.image.replaceAll("&amp;", "&");

            sendWebhook(env.CHOICE_WEBHOOK_PATH, modified_webhook_template)
                .then(() => {
                    addBundleToDatabase(
                        json.url,
                        json.offers.validFrom,
                        json.offers.validThrough,
                    );
                })
                .catch((err) => {
                    console.error(err);
                });
        });
    });
}

schedule();
setInterval(schedule, 3600000);
