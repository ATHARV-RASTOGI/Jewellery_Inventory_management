/**
 * Converts a numeric amount into formal Indian Currency words.
 * Example: 25400 -> "Rupees Twenty Five Thousand Four Hundred Only"
 */
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Rupees Zero Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const units = a[n % 10];
    return units ? `${tens} ${units}` : tens;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = "";
    if (hundred > 0) {
      str += `${a[hundred]} Hundred`;
      if (rest > 0) str += " ";
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const intPart = Math.floor(num);
  let words = "";

  const crore = Math.floor(intPart / 10000000);
  let rem = intPart % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundreds = rem;

  if (crore > 0) {
    words += `${convertThreeDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundreds > 0) {
    words += convertThreeDigits(hundreds);
  }

  words = words.trim();
  return words ? `Rupees ${words} Only` : "Rupees Zero Only";
}

const HINDI_ONES_TO_99 = [
  "", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस",
  "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस",
  "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
  "इकत्तीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस", "चालीस",
  "इकतालीस", "बयालीस", "तैंतालीस", "चौवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास", "पचास",
  "इक्यावन", "बावन", "तिरेपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ",
  "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सरसठ", "अड़सठ", "उनहत्तर", "सत्तर",
  "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी", "अस्सी",
  "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे",
  "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पंचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे"
];

/**
 * Converts a numeric amount into formal Hindi Currency words.
 * Example: 25400 -> "पच्चीस हज़ार चार सौ रुपये मात्र"
 */
export function numberToHindiWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "शून्य रुपये मात्र";

  function convertTwoDigitsHindi(n: number): string {
    if (n >= 1 && n <= 99) return HINDI_ONES_TO_99[n];
    return "";
  }

  function convertThreeDigitsHindi(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = "";
    if (hundred > 0) {
      str += `${HINDI_ONES_TO_99[hundred]} सौ`;
      if (rest > 0) str += " ";
    }
    if (rest > 0) {
      str += convertTwoDigitsHindi(rest);
    }
    return str;
  }

  const intPart = Math.floor(num);
  let words = "";

  const crore = Math.floor(intPart / 10000000);
  let rem = intPart % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundreds = rem;

  if (crore > 0) {
    words += `${convertThreeDigitsHindi(crore)} करोड़ `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigitsHindi(lakh)} लाख `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigitsHindi(thousand)} हज़ार `;
  }
  if (hundreds > 0) {
    words += convertThreeDigitsHindi(hundreds);
  }

  words = words.trim();
  return words ? `${words} रुपये मात्र` : "शून्य रुपये मात्र";
}
