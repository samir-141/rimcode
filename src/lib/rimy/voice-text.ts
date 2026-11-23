export const maximumVoiceText = 1800;

export function prepareRimySpeech(text: string) {
    return text
        .replace(/\bS\/\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\b/g,
            (_, amount: string) => `${amount.replace(/,/g, "").replace(/\.00$/, "")} soles`)
        .replace(/\/(mes|año)\b/g, " al $1")
        .replace(/\.(com|pe)\b/gi, " punto $1");
}

export const projectVoiceParts = ["basic", "detailed", "problem", "technologies", "features"] as const;
export type ProjectVoicePart = (typeof projectVoiceParts)[number];
export type VoiceReference =
    | { grant: string }
    | { greeting: true }
    | { project: string; part: ProjectVoicePart };
