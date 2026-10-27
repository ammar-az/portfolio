import { starPalettes } from "../data/starAppearance";
import type { StarAppearance } from "../data/starAppearance";

export const preferencesKey = "ammarz.preferences";
export type Preferences = {
    version: 1;
    mode: "simple" | "space";
    textureRevision: number;
    starfieldRevision: number;
    starAppearance: StarAppearance;
    motionEnabled: boolean;
    convectionEnabled: boolean;
    systemsEnabled: boolean;
    introDismissed: boolean;
};

const defaults: Preferences = {
    version: 1, mode: "simple", textureRevision: 0, starfieldRevision: 0,
    starAppearance: { color: "yellow", seed: 1871 }, motionEnabled: true,
    convectionEnabled: true, systemsEnabled: true, introDismissed: false,
};

export function readPreferences(): Preferences {
    const result = { ...defaults, starAppearance: { ...defaults.starAppearance } };
    try {
        const value = JSON.parse(localStorage.getItem(preferencesKey) ?? "null");
        if (!value || value.version !== 1) return result;
        if (value.mode === "simple" || value.mode === "space") result.mode = value.mode;
        for (const key of ["textureRevision", "starfieldRevision"] as const) {
            if (Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] <= 1_000_000_000) result[key] = value[key];
        }
        for (const key of ["motionEnabled", "convectionEnabled", "systemsEnabled", "introDismissed"] as const) {
            if (typeof value[key] === "boolean") result[key] = value[key];
        }
        if (starPalettes.some(palette => palette.id === value.starAppearance?.color)) result.starAppearance.color = value.starAppearance.color;
        if (Number.isSafeInteger(value.starAppearance?.seed) && value.starAppearance.seed >= 0 && value.starAppearance.seed <= 1_000_000_000) {
            result.starAppearance.seed = value.starAppearance.seed;
        }
    } catch { /* Private browsing, unavailable storage or invalid saved data: use defaults. */ }
    return result;
}

export function savePreferences(value: Preferences) {
    try { localStorage.setItem(preferencesKey, JSON.stringify(value)); } catch { /* Saving is optional. */ }
}
