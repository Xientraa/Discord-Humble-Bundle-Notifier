import https from "https";

export function createTimestampIndicator(
    timestamp: string,
    type: "d" | "D" | "t" | "T" | "f" | "F" | "R",
): string {
    return `<t:${Date.parse(timestamp).toString().slice(0, 10)}:${type}>`;
}

export function sendWebhook(
    webhook_url_path: string,
    payload_json: Record<string | number | symbol, unknown>,
): void {
    const payload = JSON.stringify(payload_json);
    const buffer = Buffer.alloc(payload.length, payload);
    const request = https.request(
        {
            host: "discord.com",
            port: 443,
            path: webhook_url_path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": buffer.byteLength,
            },
        },
        (req) => {
            // TODO: Add Proper Logging
            console.log(req.statusCode);
        },
    );

    request.write(buffer);
    request.end();
}
