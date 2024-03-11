import https from "https";
import { JSDOM } from "jsdom";

interface Product {
    tile_logo_information: unknown;
    machine_name: string;
    high_res_tile_image: string;
    disable_hero_title: boolean;
    marketing_blurb: string;
    hover_title: string;
    product_url: string;
    tile_image: string;
    category: string;
    hero_highlights: Array<string>;
    hover_highlights: unknown;
    author: string;
    fallback_store_sale_logo: string;
    high_res_tile_image_information: unknown;
    supports_partners: boolean;
    detailed_marketing_blurb: string;
    tile_logo: string;
    "start_date|datetime": string;
    "end_date|datetime": string;
    tile_short_name: string;
    tile_stamp: string;
    "bundles_sold|decimal": number;
    tile_name: string;
    short_marketing_blurb: string;
    tile_image_information: unknown;
    type: string;
    highlights: Array<string>;
}

interface MosaicArray {
    products: Array<Product>;
    layouts: Array<string>;
}

interface Mosaic {
    mosaic: Array<MosaicArray>;
}

interface LandingPageJSON_Data {
    books: Mosaic;
    games: Mosaic;
    software: Mosaic;
}

interface LandingPageJSON {
    data: LandingPageJSON_Data;
}

interface Brand {
    "@type": "Brand";
    name: string;
}

interface Offers {
    "@type": "AggregateOffer";
    url: string;
    availability: "http://schema.org/InStock";
    validFrom: string;
    validThrough: string;
    lowPrice: string;
    highPrice: string;
    priceCurrency: string;
}
interface MembershipBundleJSON {
    "@context": "https://schema.org/";
    "@type": "Product";
    name: string;
    sku: string;
    url: string;
    description: string;
    brand: Brand;
    image: string;
    offers: Offers;
}

export function getActiveBundlesJSON(): Promise<LandingPageJSON> {
    return new Promise((resolve, reject) => {
        https.get("https://www.humblebundle.com/bundles", (res) => {
            const data: Array<Uint8Array> = [];
            res.on("data", (chunk) => {
                data.push(chunk);
            });

            res.on("end", () => {
                const dom = new JSDOM(
                    Buffer.concat(data).toString().replaceAll(
                        // Silence "Error: Could not parse CSS stylesheet"
                        new RegExp("<style.*?>([^]*?)</style>", "g"),
                        "",
                    ),
                );
                const data_element = dom.window.document.querySelector(
                    'script[id="landingPage-json-data"]',
                );
                const string_data = data_element?.textContent;

                if (typeof string_data !== "string") {
                    return reject();
                }

                resolve(JSON.parse(string_data));
            });
        });
    });
}

export function getChoiceBundleJSON(): Promise<MembershipBundleJSON> {
    return new Promise((resolve, reject) => {
        https.get("https://www.humblebundle.com/membership", (res) => {
            const data: Array<Uint8Array> = [];
            res.on("data", (chunk) => {
                data.push(chunk);
            });

            res.on("end", () => {
                const dom = new JSDOM(
                    Buffer.concat(data).toString().replaceAll(
                        // Silence "Error: Could not parse CSS stylesheet"
                        new RegExp("<style.*?>([^]*?)</style>", "g"),
                        "",
                    ),
                );
                const bundle_information_element =
                    dom.window.document.querySelector(
                        'script[type="application/ld+json"]',
                    );
                const bundle_information_string =
                    bundle_information_element?.textContent;

                if (typeof bundle_information_string === "string") {
                    resolve(JSON.parse(bundle_information_string));
                }

                return reject();
            });
        });
    });
}
