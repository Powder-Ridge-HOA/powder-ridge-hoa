<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Menu, X, Sun, Moon } from 'lucide-vue-next';
import { useSiteStore } from '@/stores/useSiteStore';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useTheme } from '@/composables/useTheme';

const site = useSiteStore();
const { theme, toggle } = useTheme();
const mobileOpen = ref(false);
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <!-- Left: Logo -->
      <RouterLink to="/" class="site-header__logo" @click="mobileOpen = false">
        <img v-if="site.logo" :src="site.logo" :alt="site.name" class="site-header__logo-img" />
        <span v-else>{{ site.name }}</span>
      </RouterLink>

      <!-- Center: Nav links -->
      <nav class="site-header__nav" :class="{ 'site-header__nav--open': mobileOpen }">
        <RouterLink
          v-for="item in site.primaryNav"
          :key="item.to"
          :to="item.to"
          class="site-header__link"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </RouterLink>

        <!-- CTA inside mobile menu -->
        <SmartLink
          v-if="site.ctaLabel"
          :to="site.ctaUrl"
          class="site-header__cta site-header__cta--mobile"
          @click="mobileOpen = false"
        >
          {{ site.ctaLabel }}
        </SmartLink>
      </nav>

      <!-- Right: CTA + theme toggle + hamburger -->
      <div class="site-header__actions">
        <SmartLink
          v-if="site.ctaLabel"
          :to="site.ctaUrl"
          class="site-header__cta site-header__cta--desktop"
        >
          {{ site.ctaLabel }}
        </SmartLink>

        <button
          class="site-header__theme-toggle"
          :aria-label="`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`"
          @click="toggle"
        >
          <Sun v-if="theme === 'dark'" :size="20" />
          <Moon v-else :size="20" />
        </button>

        <button
          class="site-header__hamburger"
          aria-label="Toggle menu"
          @click="mobileOpen = !mobileOpen"
        >
          <X v-if="mobileOpen" :size="24" />
          <Menu v-else :size="24" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.site-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-header__logo {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.site-header__logo:hover {
  color: var(--color-primary);
}

.site-header__logo-img {
  height: 2rem;
  width: auto;
  object-fit: contain;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.site-header__link {
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.site-header__link:hover,
.site-header__link.router-link-active {
  color: var(--color-primary);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.site-header__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease;
}

.site-header__cta:hover {
  background-color: var(--color-primary-hover, var(--color-secondary));
  color: var(--color-text-inverse);
}

.site-header__cta--mobile {
  display: none;
}

.site-header__theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: 0.375rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.site-header__theme-toggle:hover {
  background-color: var(--color-border);
}

.site-header__hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: 0.375rem;
}

@media (max-width: 768px) {
  .site-header__hamburger {
    display: flex;
  }

  .site-header__cta--desktop {
    display: none;
  }

  .site-header__nav {
    display: none;
    position: absolute;
    top: 4rem;
    left: 0;
    right: 0;
    flex-direction: column;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    gap: 0.5rem;
  }

  .site-header__nav--open {
    display: flex;
  }

  .site-header__cta--mobile {
    display: inline-flex;
    margin-top: 0.5rem;
    justify-content: center;
  }

  .site-header__link {
    padding: 0.5rem 0;
  }
}
</style>
