export const BASE_GOLD_RATE_24K = 6850;
export const MAX_LTV_RATIO = 0.75;
export const MONTHLY_INTEREST_RATE = 0.015;
export const MIN_LOAN_AMOUNT = 1000;
export const MAX_LOAN_AMOUNT = 500_000;
export const MIN_LOAN_MONTHS = 1;
export const MAX_LOAN_MONTHS = 12;
export const LOW_STOCK_THRESHOLD = 3;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const PURITY_MULTIPLIERS = {
  "24K": 1.0,
  "22K": 0.916,
  "22KT": 0.9167,
  "18K": 0.750,
} as const;

export type PurityType = keyof typeof PURITY_MULTIPLIERS;

export type Subcategory = {
  id: string;
  name: string;
};

export type CategoryDef = {
  id: string;
  name: string;
  icon: string;
  subcategories?: Subcategory[];
};

export const INVENTORY_CATEGORIES: CategoryDef[] = [
  {
    id: "rings",
    name: "Rings",
    icon: "💍",
    subcategories: [
      { id: "rings-gents", name: "Gents Rings" },
      { id: "rings-womens", name: "Women's Rings" },
      { id: "rings-couple", name: "Couple Bands" },
      { id: "rings-engagement", name: "Engagement Rings" },
   
    ],
  },
  {
    id: "necklaces",
    name: "Necklaces",
    icon: "📿",
    subcategories: [
      { id: "necklaces-chokers", name: "Chokers" },
      { id: "necklaces-bridal", name: "Bridal Sets" },
      { id: "necklaces-long", name: "Long Chains" },
      { id: "necklaces-pendant", name: "Pendant Sets" },
      { id: "necklaces-temple", name: "Temple Jewellery" },
    ],
  },
  {
    id: "bangles",
    name: "Bangles",
    icon: "🔮",
    subcategories: [
      { id: "bangles-plain", name: "Plain Bangles" },
      { id: "bangles-studded", name: "Studded Bangles" },
      { id: "bangles-bridal", name: "Bridal Bangles" },
      { id: "bangles-kadas", name: "Kadas" },
      { id: "bangles-openable", name: "Openable Bangles" },
    ],
  },
  {
    id: "earrings",
    name: "Earrings",
    icon: "✨",
    subcategories: [
      { id: "earrings-studs", name: "Studs" },
      { id: "earrings-drops", name: "Drop & Dangle" },
      { id: "earrings-hoops", name: "Hoops & Huggies" },
      { id: "earrings-jhumkas", name: "Jhumkas" },
      { id: "earrings-chandbali", name: "Chandbali" },
      
    ],
  },
  {
    id: "chains",
    name: "Chains",
    icon: "⛓️",
    subcategories: [
      { id: "chains-gents", name: "Gents Chains" },
      { id: "chains-womens", name: "Women's Chains" },
      { id: "chains-rope", name: "Rope Chains" },


    ],
  },
  {
    id: "anklets",
    name: "Anklets",
    icon: "🦶",
    subcategories: [
      { id: "anklets-plain", name: "Plain Anklets" },
      { id: "anklets-beaded", name: "Beaded Anklets" },
      { id: "anklets-charm", name: "Charm Anklets" },
    ],
  },
  {
    id: "bracelets",
    name: "Bracelets",
    icon: "📎",
    subcategories: [
      { id: "bracelets-gents", name: "Gents Bracelets" },
      { id: "bracelets-womens", name: "Women's Bracelets" },
    
    ],
  },
  {
    id: "maangtikka",
    name: "Maang Tikka",
    icon: "👸",
    subcategories: [
      { id: "maangtikka-single", name: "Single Tikka" },
      { id: "maangtikka-passa", name: "Passa & Jhoomar" },
      { id: "maangtikka-bridal", name: "Bridal Tikka" },
    ],
  },
  {
    id: "nosepins",
    name: "Nose Pins",
    icon: "🌸",
    subcategories: [
      { id: "nosepins-studs", name: "Nose Studs" },
      { id: "nosepins-rings", name: "Nose Rings" },
      { id: "nosepins-nath", name: "Nath" },
    ],
  },
  {
    id: "coins",
    name: "Gold Coins & Bars",
    icon: "🪙",
    subcategories: [
      { id: "coins-1g", name: "1g Coins" },
      { id: "coins-2g", name: "2g Coins" },
      { id: "coins-5g", name: "5g Coins" },
    ],
  },
  {
    id: "sets",
    name: "Jewellery Sets",
    icon: "🎁",
    subcategories: [
      { id: "sets-bridal", name: "Bridal Sets" },
      { id: "sets-daily", name: "Daily Wear Sets" },
      { id: "sets-gifting", name: "Gifting Sets" },
    ],
  },
];

export type CategoryId = typeof INVENTORY_CATEGORIES[number]["id"];