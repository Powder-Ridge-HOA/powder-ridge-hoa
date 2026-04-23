<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { Menu, X, Sun, Moon, LogOut, User } from 'lucide-vue-next';
import { useSiteStore } from '@/stores/useSiteStore';
import SmartLink from '@/components/ui/SmartLink.vue';
import { useTheme } from '@/composables/useTheme';
import { useAuth } from '@/composables/useAuth';

const site = useSiteStore();
const { theme, toggle } = useTheme();
const { user, isAuthenticated, logout } = useAuth();

const mobileOpen = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const currentLogo = computed(() => {
  if (theme.value === 'dark' && site.darkLogo) return site.darkLogo;
  return site.logo;
});

const userLabel = computed(() => {
  const u = user.value;
  if (!u) return '';
  return (u.name as string) || (u.email as string) || 'Account';
});

const userInitial = computed(() => {
  const label = userLabel.value;
  return label ? label.charAt(0).toUpperCase() : '?';
});

function handleLogout() {
  userMenuOpen.value = false;
  logout();
}

function onDocumentClick(e: MouseEvent) {
  if (!userMenuOpen.value) return;
  const target = e.target as Node | null;
  if (userMenuRef.value && target && !userMenuRef.value.contains(target)) {
    userMenuOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <!-- Left: Logo -->
      <RouterLink to="/" class="site-header__logo" @click="mobileOpen = false">
        <img v-if="currentLogo" :src="currentLogo" :alt="site.name" class="site-header__logo-img" />
        <span v-else>{{ site.name }}</span>
      </RouterLink>

      <!-- Center: Nav links -->
      <nav id="mobile-nav" class="site-header__nav" :class="{ 'site-header__nav--open': mobileOpen }">
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

        <!-- Mobile logout -->
        <button
          v-if="isAuthenticated"
          type="button"
          class="site-header__mobile-logout"
          @click="handleLogout"
        >
          <LogOut :size="16" />
          <span>Log Out</span>
        </button>
      </nav>

      <!-- Right: CTA + user menu + theme toggle + hamburger -->
      <div class="site-header__actions">
        <SmartLink
          v-if="site.ctaLabel"
          :to="site.ctaUrl"
          class="site-header__cta site-header__cta--desktop"
        >
          {{ site.ctaLabel }}
        </SmartLink>

        <!-- User menu (only when authenticated) -->
        <div v-if="isAuthenticated" ref="userMenuRef" class="site-header__user">
          <button
            type="button"
            class="site-header__user-button"
            :aria-label="`Signed in as ${userLabel}. Open account menu.`"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="site-header__user-avatar" aria-hidden="true">{{ userInitial }}</span>
          </button>
          <div v-if="userMenuOpen" class="site-header__user-menu" role="menu">
            <div class="site-header__user-label">
              <User :size="14" />
              <span>{{ userLabel }}</span>
            </div>
            <button
              type="button"
              class="site-header__user-item"
              role="menuitem"
              @click="handleLogout"
            >
              <LogOut :size="16" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

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
          :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-nav"
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

[data-theme="dark"] .site-header__logo-img {
  filter: invert(1) hue-rotate(180deg);
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

.site-header__link:focus-visible {
  outline: 3px dashed var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
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

/* User menu */
.site-header__user {
  position: relative;
}

.site-header__user-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
}

.site-header__user-button:focus-visible {
  outline: 3px dashed var(--color-primary);
  outline-offset: 2px;
}

.site-header__user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-header__user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 16rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.5rem;
  z-index: 60;
}

.site-header__user-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.site-header__user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: calc(var(--border-radius) - 2px);
  text-align: left;
  transition: background-color 0.15s ease;
}

.site-header__user-item:hover {
  background-color: var(--color-bg-hover, var(--color-border));
}

.site-header__user-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.site-header__mobile-logout {
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

.site-header__theme-toggle:focus-visible {
  outline: 3px dashed var(--color-primary);
  outline-offset: 2px;
}

.site-header__hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  padding: 0.375rem;
}

.site-header__hamburger:focus-visible {
  outline: 3px dashed var(--color-primary);
  outline-offset: 2px;
}

.site-header__cta:focus-visible {
  outline: 3px dashed var(--color-primary);
  outline-offset: 2px;
}

.site-header__logo:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
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

  .site-header__mobile-logout {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.625rem 1rem;
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    justify-content: center;
    width: 100%;
  }
}
</style>
