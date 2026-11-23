import { NextResponse } from "next/server";
import { chatResponse } from "@/lib/rimy/chat-handler";

export async function POST(request: Request) {
    return chatResponse(request, true);
}

export async function GET() {
    return NextResponse.json({
        name: "RimBot Assistant API",
        version: "1.0.0",
        status: "active",
        bot: {
            name: "RimBot",
            company: "RimCode",
            founder: "Samir Jhoner Gomez Alarcon",
        },
        supportedCurrencies: ["PEN", "USD", "EUR"],
        endpoints: { ask: "POST /api/rimbot" },
    });
}
