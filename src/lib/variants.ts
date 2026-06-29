import type { CSSProperties } from "react";

export type ThemeVariant = {
  paletteName: string;
  fontName: string;
  button: string;
  header: string;
  card: string;
  footer: string;
  border: string;
  heroImage: string;
  style: CSSProperties;
};

const palettes = [
  {
    name: "Terracota",
    primary: "#a9472a",
    primary2: "#d36b3f",
    primary3: "#f2b36d",
    soft: "#fff5ef",
    footer: "#24110c"
  },
  {
    name: "Azul",
    primary: "#1d4ed8",
    primary2: "#2563eb",
    primary3: "#60a5fa",
    soft: "#eff6ff",
    footer: "#081429"
  },
  {
    name: "Verde",
    primary: "#047857",
    primary2: "#10b981",
    primary3: "#6ee7b7",
    soft: "#ecfdf5",
    footer: "#061c16"
  },
  {
    name: "Cinza",
    primary: "#374151",
    primary2: "#64748b",
    primary3: "#cbd5e1",
    soft: "#f8fafc",
    footer: "#111827"
  },
  {
    name: "Marrom",
    primary: "#6f4e37",
    primary2: "#94623d",
    primary3: "#d6a76c",
    soft: "#fbf7f2",
    footer: "#21160f"
  },
  {
    name: "Grafite",
    primary: "#111827",
    primary2: "#334155",
    primary3: "#94a3b8",
    soft: "#f1f5f9",
    footer: "#05070b"
  }
];

const fonts = [
  { name: "Inter", stack: "Inter, system-ui, -apple-system, Segoe UI, sans-serif" },
  { name: "Poppins", stack: "Poppins, system-ui, -apple-system, Segoe UI, sans-serif" },
  {
    name: "Montserrat",
    stack: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
  },
  { name: "Nunito", stack: "Nunito, system-ui, -apple-system, Segoe UI, sans-serif" },
  { name: "Lato", stack: "Lato, system-ui, -apple-system, Segoe UI, sans-serif" }
];

const heroImages = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1800&q=80"
];

const buttons = ["solid", "pill", "outline"];
const headers = ["classic", "centered", "compact"];
const cards = ["shadow", "flat", "line", "soft"];
const footers = ["solid", "split", "minimal", "bar"];
const borders = ["square", "rounded", "minimal"];

function pick<T>(items: T[], themeId: number, offset: number) {
  return items[Math.abs(themeId + offset) % items.length];
}

export function resolveTheme(themeId: number): ThemeVariant {
  const palette = pick(palettes, themeId, 0);
  const font = pick(fonts, themeId, 7);
  const border = pick(borders, themeId, 29);

  const radius =
    border === "square" ? "4px" : border === "minimal" ? "10px" : "18px";

  return {
    paletteName: palette.name,
    fontName: font.name,
    button: pick(buttons, themeId, 11),
    header: pick(headers, themeId, 13),
    card: pick(cards, themeId, 17),
    footer: pick(footers, themeId, 19),
    border,
    heroImage: pick(heroImages, themeId, 23),
    style: {
      "--primary": palette.primary,
      "--primary-2": palette.primary2,
      "--primary-3": palette.primary3,
      "--soft": palette.soft,
      "--footer": palette.footer,
      "--radius": radius,
      "--site-font": font.stack
    } as CSSProperties
  };
}
