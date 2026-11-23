import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { publicRoutes, startProduction } from "./production.mjs";

function post(site, route, body, options = {}) {
    return fetch(site.url + route, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-rimcode-qa-ip": "192.0.2.11", ...options.headers },
        body: JSON.stringify(body),
        signal: options.signal,
    });
}

test("rutas públicas, clasificación, validación, voz y contacto", async (t) => {
    const site = await startProduction();
    t.after(site.stop);

    for (const route of publicRoutes) {
        const response = await fetch(site.url + route);
        assert.equal(response.status, 200, route);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff", route);
        assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
        if (route === "/" || route.startsWith("/projects") || route.startsWith("/legal/")) {
            const html = await response.text();
            assert.match(html, /<title>[^<]*RimCode/i);
            assert.match(html, /<link rel="canonical" href="https?:\/\//);
            assert.match(html, /application\/ld\+json/);
        } else if (route === "/sitemap.xml") {
            const sitemap = await response.text();
            assert.match(sitemap, /<urlset/);
            for (const project of publicRoutes.filter((path) => path.startsWith("/projects/"))) {
                assert(sitemap.includes(project), project);
            }
        } else {
            await response.arrayBuffer();
        }
    }
    assert.equal((await fetch(site.url + "/projects/no-publicado")).status, 404);
    assert.equal((await fetch(site.url + "/admin")).status, 404);
    assert.equal((await fetch(site.url + "/api/rimy/voice")).status, 405);

    const started = performance.now();
    const localResponse = await post(site, "/api/rimy/chat", { message: "¿Pueden desarrollar un sistema para controlar mi almacén?" },
        { headers: { Origin: site.url, "Sec-Fetch-Site": "same-origin" } });
    const local = await localResponse.json();
    console.log(`chat_ms=${(performance.now() - started).toFixed(1)}`);
    assert.equal(local.mode, "local");
    assert.match(local.reply, /trazabilidad por lote/i);
    assert.match(local.voiceGrant, /\./);
    assert.equal(localResponse.headers.get("cache-control"), "no-store");

    const outside = await (await post(site, "/api/rimy/chat", { message: "receta de ceviche con ají" })).json();
    assert.equal(outside.mode, "local");
    assert.equal(outside.inScope, false);
    assert.deepEqual(outside.actions.map(({ id }) => id), ["elegir_cotizar", "elegir_hosting", "elegir_contacto"]);

    const legacy = await (await post(site, "/api/rimbot", { message: "¿Qué servicios ofrecen?" })).json();
    assert.equal(legacy.success, true);
    assert.match(legacy.reply, /software a medida/i);
    assert.equal((await post(site, "/api/rimy/chat", { message: "x".repeat(601) })).status, 422);
    assert.equal((await post(site, "/api/rimbot", { message: "a".repeat(9000) })).status, 413);
    assert.equal((await post(site, "/api/rimy/chat", {}, { headers: { Origin: "https://example.test" } })).status, 403);
    assert.equal((await post(site, "/api/contact", {}, { headers: { "Content-Type": "text/plain" } })).status, 415);
    const voice = { text: local.reply, grant: local.voiceGrant };
    assert.equal((await post(site, "/api/rimy/voice", { ...voice, text: "Texto de prueba diferente" })).status, 403);
    assert.equal((await post(site, "/api/rimy/voice", voice, { headers: { "x-rimcode-qa-ip": "192.0.2.98" } })).status, 403);
    assert.equal(site.state.voiceCalls, 0);

    const voiceStarted = performance.now();
    const audio = await post(site, "/api/rimy/voice", voice);
    const firstAudio = performance.now();
    assert.equal(audio.status, 200);
    assert.equal(audio.headers.get("content-type"), "audio/wav");
    assert.equal(audio.headers.get("cache-control"), "no-store");
    assert.equal(Buffer.from(await audio.arrayBuffer()).toString("ascii", 0, 4), "RIFF");
    console.log(`voice_headers_ms=${(firstAudio - voiceStarted).toFixed(1)} voice_complete_ms=${(performance.now() - voiceStarted).toFixed(1)}`);
    site.state.failVoice = true;
    assert.equal((await post(site, "/api/rimy/voice", voice)).status, 503);
    site.state.failVoice = false;

    const many = await Promise.all(Array.from({ length: 8 }, () => post(site, "/api/rimy/voice", voice)));
    assert.equal(many.filter((response) => response.status === 200).length, 6);
    assert.equal(many.filter((response) => response.status === 429).length, 2);
    assert(many.find((response) => response.status === 429).headers.has("retry-after"));
    await Promise.all(many.map((response) => response.arrayBuffer()));

    const visitors = await Promise.all(
        [22, 23, 24, 25, 26].map(async (visitor) => (await post(site, "/api/rimy/chat",
            { message: "¿Qué servicios ofrecen?" }, { headers: { "x-rimcode-qa-ip": `192.0.2.${visitor}` } })).json())
    );
    assert(visitors.every((item) => item.ok && item.mode === "local" && item.voiceGrant));
    assert.equal(new Set(visitors.map((item) => item.voiceGrant)).size, 5);

    const invalid = await post(site, "/api/contact", { name: "T", email: "mal", message: "abc" });
    assert.equal(invalid.status, 422);
    assert.deepEqual(Object.keys((await invalid.json()).fieldErrors).sort(), ["email", "message", "name", "subject"]);
    const submission = {
        name: "Prueba", email: "prueba@example.test", phone: "+51 900 000 000",
        service: "Sistema a Medida / ERP", subject: "Consulta de prueba",
        message: "Quiero evaluar un sistema de inventario.", submissionId: randomUUID(),
        startedAt: Date.now() - 5000,
    };
    const responses = await Promise.all([post(site, "/api/contact", submission), post(site, "/api/contact", submission)]);
    assert(responses.every((result) => result.status === 200));
    assert.equal(site.state.contactCalls, 1);
    assert.equal(site.state.contactPayload.phone, submission.phone);
    assert.equal(site.state.contactPayload.service, "Sistemas Empresariales / ERP");
});

test("Rimy conserva el escenario de una landing y autoriza su saludo canónico", async (t) => {
    const site = await startProduction();
    t.after(site.stop);
    let context;
    let result;
    for (const message of ["¿Cuánto cuesta una landing?", "Ya tengo dominio", "¿Y con todo?", "¿Y al mes?"]) {
        const response = await post(site, "/api/rimy/chat", { message, currency: "PEN", context });
        assert.equal(response.status, 200);
        result = await response.json();
        context = result.context;
        assert.equal(context.topic, "landing");
    }
    assert.equal(context.domain, "owned");
    assert.equal(context.hosting, "include");
    assert.equal(context.publish, true);
    assert.equal(result.action, "quote");
    assert.match(result.reply, /25\.00\/mes/);

    const greeting = await (await post(site, "/api/rimy/chat", { message: "hola" })).json();
    const greet = await post(site, "/api/rimy/voice", { greeting: true, text: greeting.reply });
    assert.equal(greet.status, 200);
    assert.equal(greet.headers.get("content-type"), "audio/wav");
    await greet.arrayBuffer();
    const invalid = await post(site, "/api/rimy/voice", { greeting: true, text: "Texto ajeno a la bienvenida" });
    assert.equal(invalid.status, 403);
    const replyAudio = await post(site, "/api/rimy/voice", { text: result.reply, grant: result.voiceGrant });
    assert.equal(replyAudio.status, 200);
    await replyAudio.arrayBuffer();
    assert.equal(site.state.voiceCalls, 2);
});

test("voz y ONNX desactivados conservan el texto y contacto sin proveedor", async (t) => {
    const site = await startProduction({ enabled: false });
    t.after(site.stop);
    const result = await (await post(site, "/api/rimy/chat", { message: "¿Qué servicios ofrecen?" })).json();
    assert.equal(result.mode, "local");
    assert.equal(result.voiceGrant, undefined);
    const audio = await post(site, "/api/rimy/voice", { text: result.reply });
    assert.equal(audio.status, 503);
    assert.equal(site.state.voiceCalls, 0);
    const contact = await post(site, "/api/contact", {
        name: "Prueba", email: "prueba@example.test", message: "Descripción del proyecto", subject: "Prueba",
    });
    assert.equal(contact.status, 503);
    assert.equal((await contact.json()).missing, undefined);
});

test("Rimy sigue el diálogo del usuario y enlaza acciones reales al registro", async (t) => {
    const logDir = await mkdtemp(join(tmpdir(), "rimy-qa-"));
    const site = await startProduction({ logDir });
    t.after(async () => {
        await site.stop();
        await Promise.all((await readdir(logDir)).map((file) => unlink(join(logDir, file))));
        await rmdir(logDir);
    });
    let estado = { ya_se_presento: true };
    let context;
    let history = [];
    const catalog = JSON.parse(await readFile(new URL("../db/services.json", import.meta.url), "utf8"));
    const contactCatalog = JSON.parse(await readFile(new URL("../db/contact.json", import.meta.url), "utf8"));
    const host = catalog.infrastructure.find(({ id }) => id === "hosting").variants[0].amountPEN;
    const ask = async (message) => {
        const response = await post(site, "/api/rimy/chat", { message, estado, context, historial_reciente: history });
        assert.equal(response.status, 200, message);
        const result = await response.json();
        assert.equal(result.intentSource, process.env.RIMY_TEST_INTENT_PORT ? "onnx" : "reglas");
        estado = result.estado;
        context = result.context;
        history = [...history.slice(-2), { rol: "usuario", contenido: message }, { rol: "asistente", contenido: result.reply }];
        return result;
    };
    const greeting = await ask("hola");
    const greeting2 = await ask("hola");
    assert.match(greeting.reply, /Hola de nuevo/);
    assert.notEqual(greeting.reply, greeting2.reply);
    assert.doesNotMatch(greeting2.reply, /Soy Rimy/);
    const social = await ask("como estas ?");
    assert.equal(social.intent.intencion, "charla_social");
    assert.match(social.reply, /bien/i);
    const reservation = await ask("como hago una reserva?");
    assert.equal(reservation.intent.intencion, "ambiguo_reserva");
    assert.equal(reservation.intent.necesita_aclaracion, true);
    assert.deepEqual(reservation.actions.map(({ id }) => id), ["elegir_reunion", "elegir_cotizar"]);
    const meeting = await ask("la reunión");
    assert.equal(meeting.estado.flujo_activo, "reunion");
    assert.deepEqual(meeting.actions.map(({ id }) => id), ["formulario"]);
    assert.equal((await ask("¿y el otro?")).estado.flujo_activo, "cotizacion");
    const order = await ask("como realizo un pedido ?");
    assert.equal(order.intent.intencion, "cotizar");
    assert.deepEqual(order.actions.map(({ href }) => href), ["/#simulador", "/#contactanos"]);
    const direct = await ask("como me contatcto con el programador");
    assert.equal(direct.intent.intencion, "contactar_programador");
    assert(direct.reply.includes(contactCatalog.whatsapp.number));
    assert.equal(new URL(direct.actions[0].href).pathname, `/${contactCatalog.whatsapp.number}`);
    const hosting = await ask("que planes de host tienen?");
    assert.equal(hosting.estado.flujo_activo, "hosting");
    assert(hosting.reply.includes(host.toFixed(2)));
    assert.match(hosting.reply, /al mes/);
    assert.equal(hosting.estado.opcion_reserva, undefined);
    assert.equal((await ask("¿y el otro?")).intent.necesita_aclaracion, true);
    await ask("Mi correo es datos-privados@example.test y mi número es +51 991 123 456");

    const options = await (await post(site, "/intent", { mensaje: "¿Cómo hago una reserva?", historial_reciente: [], estado: {} })).json();
    assert.deepEqual(Object.keys(options).sort(), ["confianza", "intencion", "necesita_aclaracion", "pregunta_aclaracion"]);
    assert.equal(options.intencion, "ambiguo_reserva");
    assert.match(options.pregunta_aclaracion, /reunión/);
    assert.equal((await post(site, "/intent", { mensaje: "hola", historial_reciente: ["sin rol"] })).status, 422);
    assert.equal((await post(site, "/intent", { mensaje: "hola" }, { headers: { Origin: "https://example.test" } })).status, 403);
    for (const evento of ["boton_clic", "simulador_abierto"]) {
        assert.equal((await post(site, "/api/rimy/event", { turnGrant: order.turnGrant, evento, accion: "simulador" })).status, 200);
    }
    assert.equal((await post(site, "/api/rimy/event", { turnGrant: order.turnGrant, evento: "boton_clic", accion: "whatsapp" })).status, 403);
    assert.equal((await post(site, "/api/contact", {
        name: "Prueba comercial", email: "envio@example.test", subject: "Cotización", message: "Quisiera revisar un sitio para mi negocio.",
        rimyTurnGrant: order.turnGrant, submissionId: randomUUID(),
    })).status, 200);
    const logs = await Promise.all((await readdir(logDir)).map((file) => readFile(join(logDir, file), "utf8")));
    const raw = logs.join("");
    assert(!raw.includes("datos-privados@example.test") && !raw.includes("991 123 456") && !raw.includes("envio@example.test"));
    assert(raw.includes("[correo omitido]") && raw.includes("[número omitido]"));
    const events = raw.trim().split("\n").map(JSON.parse);
    const { turno } = events.find(({ mensaje }) => mensaje === "como realizo un pedido ?");
    assert.deepEqual(events.filter((event) => event.turno === turno).map(({ evento }) => evento),
        ["turno", "boton_clic", "simulador_abierto", "dejo_contacto"]);
});
