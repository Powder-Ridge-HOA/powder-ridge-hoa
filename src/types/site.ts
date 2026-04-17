export interface NavItem {
  label: string;
  to: string;
}

export interface PageMeta {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
}

export interface SiteConfig {
  name: string;
  logo: string;
  darkLogo: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaHeadline: string;
  ctaSubtext: string;
  ctaFooterLabel: string;
  ctaFooterUrl: string;
  copyrightText: string;
  primaryNav: NavItem[];
  footerNav: NavItem[];
  legalNav: NavItem[];
  socialLinks: { platform: string; url: string }[];
}
