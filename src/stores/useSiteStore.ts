import { defineStore } from 'pinia';
import type { SiteConfig } from '@/types/site';

export const useSiteStore = defineStore('site', {
  state: (): SiteConfig => ({
    name: 'Powder Ridge HOA',
    logo: '',
    darkLogo: '',
    tagline: '',
    contactEmail: 'powderridgesecretary@gmail.com',
    contactPhone: '',
    address: '',
    ctaLabel: '',
    ctaUrl: '/contact',
    ctaHeadline: 'Ready to get started?',
    ctaSubtext: "Let's build something great together.",
    ctaFooterLabel: '',
    ctaFooterUrl: '',
    copyrightText: '',
    craftedBy: '',
    primaryNav: [
      { label: 'Home', to: '/' },
      { label: 'Contact', to: '/contact' },
      { label: 'FAQs', to: '/faqs' },
      { label: 'CCRs', to: '/ccrs' },
      { label: 'Board Members', to: '/board-members' },
      { label: 'Board Minutes', to: '/board-minutes' },
    ],
    footerNav: [],
    legalNav: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms-and-conditions' },
      { label: 'Accessibility Statement', to: '/accessibility' },
    ],
    socialLinks: [],
  }),
});
