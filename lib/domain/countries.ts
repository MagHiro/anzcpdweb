import type { CountryCode } from "@/db/schema";

export const COUNTRY_CONFIG = {
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    identifierType: "MARN",
    identifierLabel: "Migration Agent Registration Number (MARN)",
    cpdUnitType: "POINTS",
    cpdUnitLabel: "CPD points",
    defaultTimezone: "Australia/Sydney",
    description: "Professional development for registered migration agents working with Australian migration matters.",
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    currency: "NZD",
    identifierType: "IAA_LICENCE",
    identifierLabel: "IAA licence number",
    cpdUnitType: "HOURS",
    cpdUnitLabel: "CPD hours",
    defaultTimezone: "Pacific/Auckland",
    description: "Professional development for licensed immigration advisers working with New Zealand immigration instructions.",
  },
} as const satisfies Record<CountryCode, {
  code: CountryCode;
  name: string;
  currency: string;
  identifierType: string;
  identifierLabel: string;
  cpdUnitType: "POINTS" | "HOURS";
  cpdUnitLabel: string;
  defaultTimezone: string;
  description: string;
}>;

export function isCountryCode(value: string): value is CountryCode {
  return value === "AU" || value === "NZ";
}

export function getCountryConfig(country: CountryCode) {
  return COUNTRY_CONFIG[country];
}

export function getIdentifierLabel(country: CountryCode): string {
  return COUNTRY_CONFIG[country].identifierLabel;
}

export function getCpdLabel(unitType: string | null | undefined, amount?: string | number | null): string | null {
  if (!unitType || unitType === "NONE") return null;
  const value = amount === null || amount === undefined || amount === "" ? "" : ` ${amount}`;
  if (unitType === "POINTS") return `${value} CPD point${value === " 1" ? "" : "s"}`.trim();
  if (unitType === "HOURS") return `${value} CPD hour${value === " 1" ? "" : "s"}`.trim();
  return `${value} ${unitType.toLowerCase()}`.trim();
}
