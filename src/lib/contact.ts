import { getServices, getSettings } from "@/lib/db";
import { cleanText, isValidEmail } from "@/lib/validation";

const settings = getSettings().contact;
const services = getServices().services;
export const contactLimits = {
    name: 120, email: 254, phone: 30, company: 160, service: 160, subject: 180,
    message: settings.maxMessageLength,
};

export function resolveContactService(selection: string) {
    return services.find(({ name, id, legacyLabels }) =>
        selection === name || selection === id || legacyLabels.includes(selection)
    );
}

export function validateContact(values: Record<string, unknown>) {
    const fields = {
        name: cleanText(values.name, contactLimits.name),
        email: cleanText(values.email, contactLimits.email).toLowerCase(),
        phone: cleanText(values.phone, contactLimits.phone),
        company: cleanText(values.company, contactLimits.company),
        service: cleanText(values.service, contactLimits.service),
        subject: cleanText(values.subject, contactLimits.subject).replace(/[\r\n\t]/g, " "),
        message: cleanText(values.message, contactLimits.message),
    };
    const errors: Record<string, string> = {};
    if (fields.name.length < 2) errors.name = "Indica tu nombre (mínimo 2 caracteres).";
    if (!isValidEmail(fields.email)) errors.email = "El correo electrónico no es válido.";
    if (fields.phone && (!/^\+?[\d ()-]+$/.test(fields.phone) || !/^\d{6,18}$/.test(fields.phone.replace(/\D/g, "")))) {
        errors.phone = "Indica un número de teléfono válido.";
    }
    if (fields.subject.length < 3) errors.subject = "Indica un asunto de al menos 3 caracteres.";
    if (fields.message.length < settings.minMessageLength) {
        errors.message = `Describe tu proyecto con al menos ${settings.minMessageLength} caracteres.`;
    }
    const service = resolveContactService(fields.service);
    if (fields.service && !service) errors.service = "El servicio seleccionado no es válido.";
    if (service) fields.service = service.name;

    for (const [field, max] of Object.entries(contactLimits)) {
        const value = values[field];
        if (value !== undefined && typeof value !== "string") errors[field] = "Valor no válido.";
        if (typeof value === "string" && value.length > max) errors[field] = `El máximo es ${max} caracteres.`;
    }
    return { fields, errors };
}
