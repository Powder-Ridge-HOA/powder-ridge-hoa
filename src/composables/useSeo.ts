import { useHead } from '@unhead/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://powderridgegrandmesa.com';
const siteName = 'Powder Ridge HOA';
const defaultImage = `${siteUrl}/og-image.png`;

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Home',
    description: 'Powder Ridge HOA serves the Powder Ridge community on Grand Mesa, Colorado. Find board info, CCRs, meeting minutes, and community resources.',
  },
  '/contact': {
    title: 'Contact',
    description: 'Have a question for the Powder Ridge HOA board or Design Review Committee? Use this form to reach the right person directly.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'Privacy Policy - Powder Ridge HOA',
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions',
    description: 'Terms & Conditions - Powder Ridge HOA',
  },
  '/accessibility': {
    title: 'Accessibility Statement',
    description: 'Accessibility Statement - Powder Ridge HOA',
  },
  '/faqs': {
    title: 'FAQs',
    description: 'Answers to common questions about dues, water service, road maintenance, and the Design Review Committee.',
  },
  '/ccrs': {
    title: 'CCRs',
    description: 'Covenants, Conditions & Restrictions for the Powder Ridge development in Mesa County, Colorado.',
  },
  '/board-members': {
    title: 'Board Members',
    description: 'Meet the Powder Ridge HOA board members and contact the board or Design Review Committee.',
  },
  '/board-minutes': {
    title: 'Board Minutes',
    description: 'Financial reports and meeting minutes from Powder Ridge HOA board meetings.',
  },
  '/directory': {
    title: 'Directory',
    description: 'Directory - Powder Ridge HOA',
  },
};

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "HoaOrganization",
  "name": "Powder Ridge HOA",
  "url": "https://powderridgegrandmesa.com",
  "email": "powderridgesecretary@gmail.com"
};

export function useSeo() {
  const route = useRoute();

  const meta = computed(() => pageMeta[route.path] || {
    title: siteName,
    description: 'Purpose-driven solutions from ' + siteName + '.',
  });

  const fullTitle = computed(() => {
    const t = meta.value.title;
    return t.includes(siteName) ? t : `${t} | ${siteName}`;
  });

  const canonicalUrl = computed(() => `${siteUrl}${route.path === '/' ? '' : route.path}`);

  useHead({
    title: fullTitle,
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
    meta: [
      { name: 'description', content: computed(() => meta.value.description) },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: computed(() => meta.value.description) },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: defaultImage },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: computed(() => meta.value.description) },
      { name: 'twitter:image', content: defaultImage },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(schemaJsonLd),
      },
    ],
  });
}
