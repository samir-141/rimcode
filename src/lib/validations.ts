import { ContactFormData } from "@/types";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: ContactFormData;
}

export function validateContactForm(input: Partial<ContactFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  // Honeypot check (anti-bot)
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return {
      isValid: false,
      errors: { honeypot: "Solicitud inválida detectada." },
    };
  }

  const name = (input.name || "").trim().slice(0, 100);
  if (!name) {
    errors.name = "Por favor, ingresa tu nombre o el de tu empresa.";
  } else if (name.length < 2) {
    errors.name = "El nombre debe contener al menos 2 caracteres.";
  }

  const email = (input.email || "").trim().toLowerCase().slice(0, 120);
  if (!email) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Ingresa un correo electrónico con formato válido (ej. tu@empresa.com).";
  }

  const projectType = (input.projectType || "").trim().slice(0, 100);
  if (!projectType) {
    errors.projectType = "Selecciona el tipo de proyecto o necesidad técnica.";
  }

  const estimatedBudget = (input.estimatedBudget || "").trim().slice(0, 100);

  const message = (input.message || "").trim().slice(0, 3000);
  if (!message) {
    errors.message = "Por favor, describe brevemente la necesidad o proyecto.";
  } else if (message.length < 10) {
    errors.message = "El mensaje debe contener al menos 10 caracteres explicativos.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    sanitizedData: {
      name,
      email,
      projectType,
      estimatedBudget: estimatedBudget || undefined,
      message,
    },
  };
}

