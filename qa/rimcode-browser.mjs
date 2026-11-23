import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, firefox } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { startProduction } from "./production.mjs";

const channel = process.env.RIMCODE_TEST_BROWSER || "chrome";
const screenshots = process.env.RIMCODE_SCREENSHOT_DIR;
const catalog = JSON.parse(await readFile(new URL("../db/services.json", import.meta.url), "utf8"));
const landing = catalog.services.find(({ id }) => id === "landing");
const landingBase = landing.basePricePEN ?? landing.basePriceUSD * 3.75;
const amount = (pen) => new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pen);
const site = await startProduction();
let browser;

async function expectRimyInChat(page) {
    await page.waitForFunction(() => {
        const slot = document.getElementById("rimy-chat-slot");
        const mascot = document.querySelector('[data-rimy-mode] button[aria-expanded="true"]');
        if (!slot || !mascot) return false;
        const frame = slot.getBoundingClientRect();
        const box = mascot.getBoundingClientRect();
        const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return box.width > 24 && box.height > 24 && box.left >= frame.left && box.top >= frame.top &&
            box.right <= frame.right && box.bottom <= frame.bottom && mascot.contains(target);
    });
}

try {
    browser = channel === "firefox" ? await firefox.launch() : await chromium.launch({ channel });
    if (screenshots) await mkdir(screenshots, { recursive: true });

    for (const [width, height] of [[320, 568], [390, 640], [768, 900], [844, 390], [1280, 900], [1920, 1080]]) {
        const context = await browser.newContext({ viewport: { width, height }, colorScheme: "dark", reducedMotion: "reduce" });
        const page = await context.newPage();
        page.setDefaultTimeout(9000);
        if (width === 390) {
            await page.addInitScript(() => {
                window.rimyTestMicStarts = 0;
                sessionStorage.setItem("rimcode:quote", JSON.stringify({
                    projectType: "Web Corporativa", projectTypeId: "web-corporativa",
                    service: "Landing Page Corporativa", modules: [], currency: "USD", total: 650, totalUSD: 650,
                }));
                window.SpeechRecognition = class {
                    start() {
                        window.rimyTestMicStarts++;
                        setTimeout(() => {
                            this.onresult({ results: [[{ transcript: "Consulta de voz de prueba" }]] });
                            this.onend();
                        }, 20);
                    }
                    abort() {
                        this.onend();
                    }
                };
            });
        }
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.text().includes("Content Security Policy")) errors.push(message.text());
        });
        let rateRequests = 0;
        await page.route("https://open.er-api.com/v6/latest/USD", (route) => {
            rateRequests++;
            return route.fulfill({ json: { result: "success", rates: { EUR: 0.9, PEN: 3.75 } } });
        });
        await page.goto(site.url);
        const rejectCookies = page.getByRole("button", { name: "Rechazar opcionales", exact: true }).first();
        await rejectCookies.click();
        assert.equal((await context.cookies()).find(({ name }) => name === "rimcode-consent")?.sameSite, "Lax");

        const metrics = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            sections: [...document.querySelectorAll("main section[id]")].map((element) => element.id),
            welcome: performance.getEntriesByType("resource").some((resource) => resource.name.endsWith("rimy-welcome.wav")),
            jsBytes: performance.getEntriesByType("resource")
                .filter((resource) => resource.name.includes("/_next/static/") && resource.name.endsWith(".js"))
                .reduce((total, resource) => total + resource.encodedBodySize, 0),
        }));
        assert.equal(metrics.width, width);
        assert.deepEqual(metrics.sections, ["hero", "tecnologias", "proyectos", "simulador", "metodologia", "contactanos"]);
        assert.equal(metrics.welcome, false);
        assert.equal(rateRequests, 1);
        assert.equal(await page.locator("[data-rimy-mode]").count(), 1);
        if (width === 390) assert.equal(await page.locator("#contact-service").inputValue(), "Landing Esencial");

        if (width === 1280) {
            for (const id of ["project-cards", "technology-cards"]) {
                const rail = page.locator(`#${id}`);
                await rail.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
                const box = await rail.boundingBox();
                assert(box && box.width > 600);
                const y = box.y + Math.min(70, box.height / 2);
                await page.mouse.move(box.x + box.width * 0.72, y);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width * 0.29, y, { steps: 12 });
                await page.mouse.up();
                await page.waitForFunction((selector) => document.getElementById(selector).scrollLeft > 100, id);
                await page.mouse.move(box.x + box.width * 0.25, y);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width * 0.75, y, { steps: 12 });
                await page.mouse.up();
                await page.waitForFunction((selector) => document.getElementById(selector).scrollLeft < 8, id);
                assert.equal(new URL(page.url()).pathname, "/");
            }
            const details = page.locator("#project-cards details").first();
            await details.locator("summary").click();
            assert((await details.locator("li").count()) > 3);
            await details.locator("summary").click();
        }

        if (width < 1024) {
            const menu = page.getByRole("button", { name: "Abrir menú", exact: true });
            await menu.click();
            await page.locator("#mobile-navigation").getByRole("button", { name: "Simulador", exact: true }).click();
            await menu.waitFor();
        }

        await page.locator("#simulador").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
        assert.equal(await page.locator("#simulador h2").evaluate((element) =>
            element.getBoundingClientRect().top >= document.querySelector(".rim-header").getBoundingClientRect().bottom
        ), true);

        if (width === 390) {
            const delivery = page.getByLabel("Modalidad de entrega");
            await delivery.selectOption("express");
            await page.getByText(`S/ ${amount(landingBase * catalog.delivery.find(({ id }) => id === "express").multiplier)}`, { exact: true }).first().waitFor();
            await delivery.selectOption("publish");
            await page.getByText(`S/ ${amount(landingBase + landing.publicationPEN)}`, { exact: true }).first().waitFor();
            await delivery.selectOption("code");

            const domain = page.getByLabel("Dominio", { exact: true });
            const hosting = page.getByLabel("Hosting", { exact: true });
            await domain.selectOption("include");
            await page.getByLabel("Extensión").selectOption("pe");
            await hosting.selectOption("include");
            const budget = page.getByLabel("Presupuesto de hosting en S/ por mes");
            await budget.fill("30");
            const domainPrice = catalog.infrastructure.find(({ id }) => id === "domain").variants.find(({ id }) => id === "pe").amountPEN;
            await page.getByText(`S/ ${amount(landingBase + domainPrice + 30 * 12)}`, { exact: true }).first().waitFor();
            await domain.selectOption("owned");
            await page.getByText("Ya contratado", { exact: true }).first().waitFor();
            await domain.selectOption("none");
            await hosting.selectOption("none");
        }
        const erp = page.getByRole("radio", { name: /Sistemas Empresariales/ });
        await erp.check();
        await page.getByText("Módulos e integraciones", { exact: true }).click();
        await page.getByRole("checkbox", { name: "Inventario y trazabilidad" }).check();
        await page.getByLabel("Hosting", { exact: true }).selectOption("include");
        await page.getByText("Desarrollo sujeto a evaluación", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Preparar solicitud de cotización" }).click();
        assert.equal(await page.locator("#contact-service").inputValue(), "Sistemas Empresariales / ERP");
        assert.match(await page.locator("#contact-message").inputValue(), /Hosting \(S\/\s+(?:25|30)\.00\/mes\)/);
        assert.equal(await page.locator("#contact-name").evaluate((element) => {
            const box = element.getBoundingClientRect();
            const headerBottom = document.querySelector(".rim-header").getBoundingClientRect().bottom;
            return document.activeElement === element && box.top >= headerBottom && box.bottom <= window.innerHeight;
        }), true);

        if ([390, 1280].includes(width)) {
            const trigger = page.getByRole("button", { name: "Abrir configuración de cookies y privacidad" });
            await trigger.click();
            const modal = page.getByRole("dialog");
            await modal.waitFor();
            await page.keyboard.press("Shift+Tab");
            assert.equal(await modal.evaluate((element) => element.contains(document.activeElement)), true);
            await page.keyboard.press("Escape");
            await modal.waitFor({ state: "hidden" });
            assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
            const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
            metrics.axe = axe.violations.map(({ id, nodes }) => [id, nodes.length]);
            if (process.env.RIMCODE_AXE_DETAILS === "1") {
                console.log(JSON.stringify(axe.violations.map(({ id, nodes }) =>
                    ({ id, nodes: nodes.slice(0, 30).map(({ target, failureSummary }) => ({ target, failureSummary })) }))));
            }
            assert.deepEqual(metrics.axe, []);
            if (width === 390) {
                await page.getByRole("button", { name: "Cambiar a modo claro" }).click();
                await page.waitForFunction(() => document.documentElement.classList.contains("light"));
                await page.waitForFunction(() => !document.getAnimations().some(
                    (animation) => animation instanceof CSSTransition && animation.playState === "running"
                ));
                const light = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
                metrics.axeLight = light.violations.map(({ id, nodes }) => [id, nodes.length]);
                if (process.env.RIMCODE_AXE_DETAILS === "1") {
                    console.log(JSON.stringify(light.violations.map(({ id, nodes }) =>
                        ({ id, nodes: nodes.slice(0, 15).map(({ target, failureSummary }) => ({ target, failureSummary })) }))));
                }
                assert.deepEqual(metrics.axeLight, []);
                await page.getByRole("button", { name: "Cambiar a modo oscuro" }).click();
            }
        }

        if (screenshots && [320, 1280].includes(width)) {
            await page.locator("#simulador").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
            await page.screenshot({ path: join(screenshots, `${channel}-${width}-simulador.png`) });
        }

        if (width === 390) {
            const payloads = site.state.contactCalls;
            await page.locator("#contact-name").fill("Prueba de navegador");
            await page.locator("#contact-email").fill("prueba@example.test");
            await page.locator("#contact-phone").fill("900 000 000");
            await page.waitForFunction(() => performance.now() > 3000);
            await page.getByRole("button", { name: /Enviar Mensaje a RimCode/ }).click();
            await page.getByRole("button", { name: "Enviar otra consulta" }).waitFor();
            assert.equal(site.state.contactCalls, payloads + 1);
        }

        const opener = page.getByRole("button", { name: "Abrir chat de Rimy", exact: true });
        await opener.click();
        const chat = page.getByRole("region", { name: "Rimy", exact: false });
        const input = page.getByRole("textbox", { name: "Escribe tu pregunta sobre RimCode" });
        await input.waitFor();
        assert.equal(await input.evaluate((element) => element === document.activeElement), true);
        await expectRimyInChat(page);
        const inputBox = await input.boundingBox();
        assert(inputBox.y >= 0 && inputBox.y + inputBox.height <= height + 1);
        if (screenshots && width === 320) await page.screenshot({ path: join(screenshots, `${channel}-320-chat.png`) });
        if (width === 390) {
            assert.equal(await page.evaluate(() => window.rimyTestMicStarts), 0);
            let submitted = false;
            page.on("request", (request) => {
                if (request.url().endsWith("/api/rimy/chat")) submitted = true;
            });
            await chat.getByText(/Preguntas sugeridas y voz/).click();
            await chat.getByRole("button", { name: "Dictar con micrófono" }).click();
            await page.waitForFunction(() => document.querySelector("#rimy-assistant form input").value === "Consulta de voz de prueba");
            assert.equal(submitted, false);
            assert.equal(await page.evaluate(() => window.rimyTestMicStarts), 1);
            await chat.getByText(/Preguntas sugeridas y voz/).click();
        }

        const initialVoiceCalls = site.state.voiceCalls;
        await input.fill("¿Pueden desarrollar un sistema para controlar mi almacén?");
        const started = performance.now();
        await input.press("Enter");
        const answer = chat.getByRole("log").getByText(/trazabilidad por lote/i);
        await answer.waitFor();
        metrics.chatMs = Math.round(performance.now() - started);
        assert.equal(site.state.voiceCalls, initialVoiceCalls);
        assert.equal(await page.locator("[data-rimy-mode]").count(), 1);

        if ([390, 844, 1280].includes(width)) {
            await chat.getByText(/Preguntas sugeridas y voz/).click();
            await chat.getByRole("checkbox", { name: "Reproducir respuestas" }).check();
            await chat.getByRole("checkbox", { name: "Reproducir respuestas" }).uncheck();
            await chat.getByText(/Preguntas sugeridas y voz/).click();

            const play = chat.getByRole("button", { name: /^Escuchar$|Volver a escuchar/ }).last();
            site.state.voiceDelay = 500;
            await play.click();
            await chat.getByText("Preparando voz…").waitFor();
            await chat.getByRole("button", { name: "Detener" }).click();
            await chat.getByText("Preparando voz…").waitFor({ state: "hidden" });
            site.state.voiceDelay = 40;
            site.state.failVoice = true;
            await play.click();
            await chat.getByText(/No se pudo reproducir la voz/).waitFor();
            assert.equal(await answer.isVisible(), true);
            site.state.failVoice = false;

            const voiceStart = performance.now();
            await play.click();
            await chat.getByText("Rimy está hablando").waitFor();
            metrics.firstPlaybackMs = Math.round(performance.now() - voiceStart);
            assert.equal(await page.locator("[data-rimy-mode]").getAttribute("data-rimy-animation"), "talking");
            await expectRimyInChat(page);
            assert.equal(await input.evaluate((element) => {
                const box = element.getBoundingClientRect();
                return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element;
            }), true);
            await chat.getByRole("button", { name: "Pausar" }).click();
            await chat.getByText("Voz en pausa").waitFor();
            await chat.getByRole("button", { name: "Continuar" }).click();
            await chat.getByText("Rimy está hablando").waitFor();
            await input.fill("¿Qué servicios ofrecen?");
            await input.press("Enter");
            await chat.getByText("Rimy está hablando").waitFor({ state: "hidden" });
            await chat.getByText(/Trabajamos con profesionales/).waitFor();
            if (width === 1280) {
                const history = chat.getByRole("log");
                const previous = await history.evaluate((element) => ({ pageY: window.scrollY, historyY: element.scrollTop }));
                assert(previous.historyY > 0);
                await history.hover();
                await page.mouse.wheel(0, -250);
                await page.waitForFunction((historyY) =>
                    document.querySelector("#rimy-assistant [role=log]").scrollTop < historyY, previous.historyY);
                assert.equal(await page.evaluate(() => window.scrollY), previous.pageY);
                await page.setViewportSize({ width: 495, height: 768 });
                await expectRimyInChat(page);
                await page.setViewportSize({ width, height });
                await expectRimyInChat(page);
            }
        }

        if (width === 390) {
            await page.getByRole("button", { name: "Minimizar chat de Rimy", exact: true }).click();
            await input.waitFor({ state: "hidden" });
            await opener.click();
            await expectRimyInChat(page);
            await answer.waitFor();
        }
        await input.press("Escape");
        await input.waitFor({ state: "hidden" });
        assert.equal(await opener.evaluate((element) => element === document.activeElement), true);
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ browser: channel, width, height, ...metrics }));
        await context.close();
    }

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "no-preference" });
    page.setDefaultTimeout(9000);
    await page.goto(site.url + "/projects");
    await page.getByRole("button", { name: "Rechazar opcionales", exact: true }).first().click();
    await page.getByRole("button", { name: "Abrir chat de Rimy" }).click();
    const input = page.getByRole("textbox", { name: "Escribe tu pregunta sobre RimCode" });
    await input.fill("¿Qué servicios ofrecen?");
    await input.press("Enter");
    await page.getByText(/Trabajamos con profesionales/).waitFor();
    await page.getByRole("button", { name: /^Escuchar$/ }).last().click();
    await page.getByText("Rimy está hablando").waitFor();
    await page.locator('[data-rimy-animation="talking"]').waitFor();
    if (channel === "chrome") {
        await page.locator('[data-rimy-measured="true"]').waitFor();
        await page.waitForFunction(() => Number(
            document.querySelector("[data-rimy-measured]")?.style.getPropertyValue("--rimy-mouth")
        ) > 0.4);
    }
    const projectLink = page.locator('a[href^="/projects/"]').first();
    await projectLink.evaluate((link) => link.click());
    await page.waitForURL("**/projects/*");
    await page.getByText("Rimy está hablando").waitFor({ state: "hidden" });
    assert.equal(await page.locator("[data-rimy-mode]").count(), 1);
    await page.close();
    await delay(20);
} finally {
    await browser?.close();
    await site.stop();
}
