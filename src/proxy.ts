import { type NextRequest, NextResponse } from "next/server";
import { getProjectSlugs } from "@/lib/db";

const publishedProjects = new Set(getProjectSlugs());

export function proxy(request: NextRequest) {
    const slug = request.nextUrl.pathname.split("/").filter(Boolean).at(-1);
    if (!slug || publishedProjects.has(slug)) return NextResponse.next();

    // Resuelve el 404 antes de que la ficha empiece a enviar su shell.
    return NextResponse.rewrite(new URL("/__proyecto-no-encontrado", request.url));
}

export const config = { matcher: "/projects/:slug" };
