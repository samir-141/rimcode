import { NextRequest, NextResponse } from "next/server";
import { validateContactForm } from "@/lib/validations";
import { siteConfig } from "@/data/site";

// Simple in-memory rate limiter (5 requests per IP every 10 minutes)
const ipRateLimit = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);

  if (!entry || now > entry.expiresAt) {
    ipRateLimit.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "Has alcanzado el límite temporal de envíos. Por favor, intenta de nuevo en unos minutos o escríbeme directamente a WhatsApp.",
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Formato de solicitud no válido (se esperaba JSON)." },
        { status: 400 }
      );
    }

    const validation = validateContactForm(body);
    if (!validation.isValid || !validation.sanitizedData) {
      return NextResponse.json(
        {
          error: "Los datos enviados no son válidos.",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, projectType, estimatedBudget, message } =
      validation.sanitizedData;

    // Check optional Resend email delivery
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "RimCode Web <onboarding@resend.dev>",
            to: [siteConfig.contact.email],
            subject: `[RimCode] Nueva consulta de ${name} (${projectType})`,
            text: `Nuevo mensaje de contacto en RimCode:\n\nNombre: ${name}\nEmail: ${email}\nTipo de proyecto: ${projectType}\nPresupuesto orientativo: ${
              estimatedBudget || "No especificado"
            }\n\nMensaje:\n${message}`,
          }),
        });

        if (!resendRes.ok) {
          console.error("Resend delivery failed with status", resendRes.status);
        }
      } catch (err) {
        console.error("Resend API error:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Tu mensaje ha sido enviado correctamente. Me pondré en contacto contigo lo antes posible para evaluar tu proyecto.",
      },
      { status: 200 }
    );
  } catch {
    console.error("Unhandled contact route error");
    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado al procesar la solicitud. Por favor, intenta de nuevo o comunícate vía WhatsApp.",
      },
      { status: 500 }
    );
  }
}

