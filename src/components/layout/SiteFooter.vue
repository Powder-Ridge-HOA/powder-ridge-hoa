<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useSiteStore } from '@/stores/useSiteStore';
import { useSanity } from '@/composables/useSanity';
import { getSocialIcon } from '@/composables/useSocialIcons';
import SmartLink from '@/components/ui/SmartLink.vue';

const site = useSiteStore();
const year = new Date().getFullYear();

const { data: socialDoc } = useSanity<{ links: { platform: string; url: string }[] }>(
  `*[_type == "socialLinks"][0]{"links": coalesce(links, items)}`
);
const socialLinks = computed(() => {
  const raw = socialDoc.value?.links || site.socialLinks;
  return raw.map((l) => ({ ...l, platform: l.platform.toLowerCase() }));
});

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  github: 'GitHub',
  pinterest: 'Pinterest',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  nextdoor: 'Nextdoor',
};
</script>

<template>
  <footer class="site-footer">
    <!-- Section 1: CTA Band -->
    <div v-if="site.ctaFooterLabel || site.ctaLabel" class="cta-band">
      <div class="cta-band__inner">
        <h2 class="cta-band__heading">{{ site.ctaHeadline }}</h2>
        <p class="cta-band__text">{{ site.ctaSubtext }}</p>
        <SmartLink :to="site.ctaFooterUrl || site.ctaUrl" class="cta-band__button">
          {{ site.ctaFooterLabel || site.ctaLabel }}
        </SmartLink>
      </div>
    </div>

    <!-- Section 2: Bottom Bar -->
    <div class="bottom-bar">
      <div class="bottom-bar__inner">
        <!-- Legal nav row -->
        <nav v-if="site.legalNav.length" class="bottom-bar__legal">
          <RouterLink
            v-for="item in site.legalNav"
            :key="item.to"
            :to="item.to"
            class="bottom-bar__legal-link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- Copyright + Social row -->
        <div class="bottom-bar__meta">
          <p class="bottom-bar__copyright">
            {{ site.copyrightText || `© ${year} ${site.name}. All rights reserved.` }}
          </p>
          <div v-if="socialLinks.length" class="bottom-bar__social">
            <a
              v-for="link in socialLinks"
              :key="link.platform"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="bottom-bar__social-link"
              :aria-label="platformLabels[link.platform] || link.platform"
            >
              <svg v-if="getSocialIcon(link.platform)" class="bottom-bar__social-svg" viewBox="0 0 24 24" fill="currentColor">
                <path :d="getSocialIcon(link.platform)!" />
              </svg>
              <span v-else class="bottom-bar__social-fallback">{{ (platformLabels[link.platform] || link.platform).charAt(0) }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
}

/* ─── Section 1: CTA Band ─── */
.cta-band {
  background-color: #1f2937;
  padding: 4rem 1.5rem;
  text-align: center;
}

.cta-band__inner {
  max-width: 48rem;
  margin: 0 auto;
}

.cta-band__heading {
  font-family: var(--font-heading);
  font-size: 1.875rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.cta-band__text {
  font-size: 1.125rem;
  color: #d1d5db;
  margin-bottom: 2rem;
}

.cta-band__button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 2rem;
  background-color: #ffffff;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.cta-band__button:hover {
  background-color: var(--color-accent);
  color: #111827;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cta-band__button:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* ─── Section 2: Bottom Bar ─── */
.bottom-bar {
  background-color: #000000;
  padding: 1.25rem 1.5rem;
}

.bottom-bar__inner {
  max-width: 72rem;
  margin: 0 auto;
}

/* Legal nav row */
.bottom-bar__legal {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
}

.bottom-bar__legal-link {
  font-size: 0.8125rem;
  color: #d1d5db;
  transition: color 0.2s ease;
  border-radius: 2px;
}

.bottom-bar__legal-link:hover {
  color: #ffffff;
}

.bottom-bar__legal-link:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* Copyright + Social row */
.bottom-bar__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.bottom-bar__copyright {
  font-size: 0.875rem;
  color: #d1d5db;
}

.bottom-bar__social {
  display: flex;
  gap: 1.25rem;
}

.bottom-bar__social-link {
  display: inline-flex;
  align-items: center;
  color: #d1d5db;
  transition: color 0.2s ease;
  border-radius: 4px;
}

.bottom-bar__social-link:hover {
  color: #ffffff;
}

.bottom-bar__social-link:focus-visible {
  outline: 3px dashed rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

.bottom-bar__social-svg {
  width: 1.25rem;
  height: 1.25rem;
}

.bottom-bar__social-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .cta-band__heading {
    font-size: 1.5rem;
  }

  .bottom-bar__meta {
    flex-direction: column;
    text-align: center;
  }
}
</style>
