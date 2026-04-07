/* ── Holiday types & helpers ── */

export interface Holiday {
  name: string;
  description: string;
  date: {
    iso: string;
    datetime: { year: number; month: number; day: number };
  };
  type: string[];
}

export interface CountryOption {
  code: string;
  name: string;
}

/** Convert a 2-letter ISO country code to its flag emoji */
export function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Major countries list (ISO 3166-1 alpha-2) */
export const COUNTRIES: CountryOption[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "KR", name: "South Korea" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "UAE" },
  { code: "UA", name: "Ukraine" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
];

/** Detect user's country from browser locale or timezone */
export function detectCountry(): string {
  if (typeof navigator === "undefined") return "IN";
  // Try locale first (e.g., "en-IN" → "IN")
  const locale = navigator.language || "";
  const parts = locale.split("-");
  if (parts.length >= 2) {
    const code = parts[parts.length - 1].toUpperCase();
    if (code.length === 2 && COUNTRIES.some((c) => c.code === code)) {
      return code;
    }
  }
  // Fallback to timezone-based detection
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzCountryMap: Record<string, string> = {
      "Asia/Kolkata": "IN",
      "Asia/Calcutta": "IN",
      "Asia/Mumbai": "IN",
      "America/New_York": "US",
      "America/Chicago": "US",
      "America/Los_Angeles": "US",
      "America/Denver": "US",
      "America/Phoenix": "US",
      "Europe/London": "GB",
      "Europe/Paris": "FR",
      "Europe/Berlin": "DE",
      "Europe/Madrid": "ES",
      "Europe/Rome": "IT",
      "Europe/Amsterdam": "NL",
      "Asia/Tokyo": "JP",
      "Asia/Shanghai": "CN",
      "Asia/Singapore": "SG",
      "Asia/Dubai": "AE",
      "Asia/Karachi": "PK",
      "Asia/Dhaka": "BD",
      "Australia/Sydney": "AU",
      "Australia/Melbourne": "AU",
      "America/Toronto": "CA",
      "America/Sao_Paulo": "BR",
      "Asia/Seoul": "KR",
      "Asia/Bangkok": "TH",
      "Europe/Moscow": "RU",
      "Europe/Istanbul": "TR",
      "Africa/Lagos": "NG",
      "Africa/Cairo": "EG",
      "Pacific/Auckland": "NZ",
    };
    if (tzCountryMap[tz]) return tzCountryMap[tz];
  } catch {
    // ignore
  }
  return "IN";
}

/** Holiday type -> dot color mapping */
export function holidayColor(types: string[]): string {
  if (types.some((t) => t.toLowerCase().includes("national"))) return "#ff4757"; // Vibrant red
  if (types.some((t) => t.toLowerCase().includes("public"))) return "#ff6348"; // Tomato red
  if (types.some((t) => t.toLowerCase().includes("religious")))
    return "#5f27cd"; // Deep purple
  if (types.some((t) => t.toLowerCase().includes("observance")))
    return "#00d2d3"; // Bright cyan
  if (types.some((t) => t.toLowerCase().includes("local"))) return "#ffa502"; // Vivid orange
  if (types.some((t) => t.toLowerCase().includes("federal"))) return "#ff3742"; // Bright red
  if (types.some((t) => t.toLowerCase().includes("bank"))) return "#2ed573"; // Bright green
  if (types.some((t) => t.toLowerCase().includes("christmas")))
    return "#c44569"; // Rose red
  if (types.some((t) => t.toLowerCase().includes("easter"))) return "#a29bfe"; // Light purple
  if (types.some((t) => t.toLowerCase().includes("new"))) return "#48dbfb"; // Sky blue
  return "#3498db"; // Default blue
}
