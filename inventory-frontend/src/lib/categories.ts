// ─────────────────────────────────────────────────────────────
// Single source of truth for Gold & Silver category trees.
// Persisted in localStorage; falls back to built-in defaults.
// ─────────────────────────────────────────────────────────────
import { useCallback, useSyncExternalStore } from "react";

/* ── Types ────────────────────────────────────────────────── */
export type SubCategory = { id: string; label: string };
export type Category = { id: string; label: string; subcategories: SubCategory[] };
export type CategoryConfig = Category[];

/* ── localStorage keys ────────────────────────────────────── */
const STORAGE_KEY_GOLD = "kk-categories-gold";
const STORAGE_KEY_SILVER = "kk-categories-silver";

/* ── Defaults (what was previously hardcoded) ─────────────── */
export const DEFAULT_GOLD_CATEGORIES: CategoryConfig = [
  {
    id: "rings",
    label: "Rings",
    subcategories: [
      { id: "rings-gents", label: "Gents Rings" },
      { id: "rings-womens", label: "Women's Rings" },
      { id: "rings-couple", label: "Couple Bands" },
    ],
  },
  {
    id: "necklaces",
    label: "Necklaces",
    subcategories: [
      { id: "necklaces-short", label: "Short Necklaces" },
      { id: "necklaces-long", label: "Long Necklaces" },
      { id: "necklaces-choker", label: "Chokers" },
    ],
  },
  {
    id: "bangles",
    label: "Bangles",
    subcategories: [
      { id: "bangles-daily", label: "Daily Wear" },
      { id: "bangles-bridal", label: "Bridal Bangles" },
    ],
  },
  {
    id: "earrings",
    label: "Earrings",
    subcategories: [
      { id: "earrings-studs", label: "Studs" },
      { id: "earrings-drops", label: "Drops & Danglers" },
    ],
  },
  {
    id: "sets",
    label: "Jewellery Sets",
    subcategories: [
      { id: "sets-bridal", label: "Bridal Sets" },
      { id: "sets-light", label: "Lightweight Sets" },
    ],
  },
  {
    id: "coins",
    label: "Gold Coins & Bars",
    subcategories: [
      { id: "coins-1g", label: "1g - 5g Coins" },
      { id: "coins-10g", label: "10g+ Coins & Bars" },
    ],
  },
];

export const DEFAULT_SILVER_CATEGORIES: CategoryConfig = [
  {
    id: "anklets",
    label: "Anklets (Payal)",
    subcategories: [
      { id: "anklets-daily", label: "Daily Wear" },
      { id: "anklets-bridal", label: "Bridal Heavy" },
    ],
  },
  {
    id: "bracelets",
    label: "Bracelets & Kadas",
    subcategories: [
      { id: "bracelets-mens", label: "Men's Kadas" },
      { id: "bracelets-womens", label: "Women's Bracelets" },
    ],
  },
  {
    id: "rings",
    label: "Silver Rings",
    subcategories: [
      { id: "rings-mens", label: "Men's Rings" },
      { id: "rings-womens", label: "Women's Rings" },
    ],
  },
  {
    id: "pooja",
    label: "Pooja Items & Utensils",
    subcategories: [
      { id: "pooja-idols", label: "Idols (Murti)" },
      { id: "pooja-utensils", label: "Utensils (Bartan)" },
    ],
  },
  {
    id: "coins",
    label: "Silver Coins & Bars",
    subcategories: [
      { id: "coins-10g", label: "10g - 50g Coins" },
      { id: "coins-100g", label: "100g+ Bars" },
    ],
  },
];

/* ── Read / Write helpers ─────────────────────────────────── */
function storageKey(metal: "gold" | "silver") {
  return metal === "gold" ? STORAGE_KEY_GOLD : STORAGE_KEY_SILVER;
}

function defaults(metal: "gold" | "silver") {
  return metal === "gold" ? DEFAULT_GOLD_CATEGORIES : DEFAULT_SILVER_CATEGORIES;
}

export function getCategories(metal: "gold" | "silver"): CategoryConfig {
  try {
    const raw = localStorage.getItem(storageKey(metal));
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupt data — fall back
  }
  return defaults(metal);
}

export function saveCategories(metal: "gold" | "silver", cats: CategoryConfig) {
  localStorage.setItem(storageKey(metal), JSON.stringify(cats));
  // Dispatch a storage event so other tabs AND our own useSyncExternalStore pick it up
  window.dispatchEvent(new StorageEvent("storage", { key: storageKey(metal) }));
}

/* ── Build the sidebar-ready structure (prefixed IDs) ─────── */
export function getSidebarCategories(metal: "gold" | "silver"): {
  id: string;
  label: string;
  subcategories: { id: string; label: string }[];
}[] {
  return getCategories(metal).map((cat) => ({
    id: `${metal}-${cat.id}`,
    label: cat.label,
    subcategories: cat.subcategories.map((sub) => ({
      id: `${metal}-${sub.id}`,
      label: sub.label,
    })),
  }));
}

/* ── React hook ───────────────────────────────────────────── */
// Uses useSyncExternalStore so every consumer re-renders when
// saveCategories() is called anywhere in the app.

let _snapshotGold = getCategories("gold");
let _snapshotSilver = getCategories("silver");

function subscribe(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_GOLD || e.key === STORAGE_KEY_SILVER || e.key === null) {
      _snapshotGold = getCategories("gold");
      _snapshotSilver = getCategories("silver");
      cb();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useCategories() {
  const gold = useSyncExternalStore(subscribe, () => _snapshotGold);
  const silver = useSyncExternalStore(subscribe, () => _snapshotSilver);

  const setGold = useCallback((cats: CategoryConfig) => {
    _snapshotGold = cats;
    saveCategories("gold", cats);
  }, []);

  const setSilver = useCallback((cats: CategoryConfig) => {
    _snapshotSilver = cats;
    saveCategories("silver", cats);
  }, []);

  return { gold, silver, setGold, setSilver };
}
