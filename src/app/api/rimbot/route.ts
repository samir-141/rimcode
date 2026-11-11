import { NextResponse } from "next/server";
import { getBotResponse } from "@/components/landing/welcome/rimbot-data";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, currency = "PEN" } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                {
                    error: "El mensaje es obligatorio y debe ser una cadena de texto válida.",
                },
                { status: 400 }
            );
        }

        const validCurrency = ["PEN", "USD", "EUR"].includes(currency)
            ? (currency as "PEN" | "USD" | "EUR")
            : "PEN";

        // Obtener respuesta inteligente contextual
        const botResponse = getBotResponse(message, validCurrency);

        return NextResponse.json({
            success: true,
            reply: botResponse.text,
            emotion: botResponse.emotion,
            suggestions: botResponse.suggestions,
            timestamp: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                reply: "Lo siento, tuve un pequeño fallo en mis circuitos al procesar tu solicitud. Por favor intenta de nuevo.",
                emotion: "thinking",
                suggestions: ["¿Qué servicios ofrecen?", "¿Quién es el fundador?"],
            },
            { status: 500 }
        );
    }
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
        endpoints: {
            ask: "POST /api/rimbot",
        },
    });
}

