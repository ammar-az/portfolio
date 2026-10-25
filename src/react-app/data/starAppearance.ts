export const starPalettes = [
    { id: "yellow", name: "Yellow", color: "#ffb400", highlight: "#fff01d", shadow: "#b52d00" },
    { id: "red", name: "Red", color: "#ff3514", highlight: "#ff7b00", shadow: "#850408" },
    { id: "blue", name: "Blue", color: "#8fbfff", highlight: "#e6f1ff", shadow: "#3e73b0" },
    // Preserve the old key so an existing Cyan selection becomes White on live updates.
    { id: "cyan", name: "White", color: "#eff5ff", highlight: "#ffffff", shadow: "#adc1e3" },
    { id: "green", name: "Green", color: "#9cffaa", highlight: "#e9ffdb", shadow: "#389a66" },
    { id: "purple", name: "Dark star", color: "#222b86", highlight: "#827cfa", shadow: "#05091c" },
] as const;

export type StarPalette = typeof starPalettes[number];
export type StarFinish = "textured" | "smooth";
export type StarAppearance = { color: StarPalette["id"]; finish: StarFinish; seed: number };
