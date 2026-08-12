export const SITE_NAME = "Domain Expert";
export const SITE_TAGLINE = "Prove you actually know your industry.";
export const SITE_URL = "domainexpert.demo";

export const QUESTION_TIME_MS = 20_000;
export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 15;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Marketing",
  "Supply Chain & Logistics",
  "Legal",
  "Real Estate",
  "HR & Recruiting",
  "Sales",
  "Consulting",
  "Education",
  "Manufacturing",
  "Media",
  "Design",
  "Data & Analytics",
  "Construction",
  "Hospitality",
  "Energy",
  "Government",
  "Nonprofit",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
