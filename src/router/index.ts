import { createRouter, createWebHistory } from 'vue-router';
import { watchEffect } from 'vue';

import { useAuth0 } from '@auth0/auth0-vue';

const STRATEGY = import.meta.env.VITE_AUTH0_WHITELIST_STRATEGY || 'role';
const ROLES_CLAIM = import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://pws.app/roles';
const WHITELIST_CLAIM = import.meta.env.VITE_AUTH0_WHITELIST_CLAIM || 'https://pws.app/whitelisted';
const ROLE_NAME = import.meta.env.VITE_AUTH0_ROLE_NAME || 'Resident';

function checkMember(user: Record<string, unknown>): boolean {
  if (STRATEGY === 'role') {
    const roles = user[ROLES_CLAIM];
    return Array.isArray(roles) && roles.includes(ROLE_NAME);
  }
  return user[WHITELIST_CLAIM] === true;
}

const Home = () => import('@/pages/Home.vue');
const Contact = () => import('@/pages/Contact.vue');
const PrivacyPolicy = () => import('@/components/layout/LegalPage.vue');
const TermsAndConditions = () => import('@/components/layout/LegalPage.vue');
const Accessibility = () => import('@/components/layout/LegalPage.vue');
const Faqs = () => import('@/pages/Faqs.vue');
const Ccrs = () => import('@/pages/Ccrs.vue');
const BoardMembers = () => import('@/pages/BoardMembers.vue');
const BoardMinutes = () => import('@/pages/BoardMinutes.vue');
const Directory = () => import('@/pages/Directory.vue');
const LoginPage = () => import('@/pages/LoginPage.vue');
const CallbackPage = () => import('@/pages/CallbackPage.vue');
const UnauthorizedPage = () => import('@/pages/UnauthorizedPage.vue');
const ProjectDetail = () => import('@/pages/ProjectDetail.vue');
const TeamProjectDetail = () => import('@/pages/TeamProjectDetail.vue');
const NotFound = () => import('@/pages/NotFound.vue');

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact,
  },
  {
    path: '/privacy-policy',
    name: 'Privacy Policy',
    component: PrivacyPolicy,
  },
  {
    path: '/terms-and-conditions',
    name: 'Terms & Conditions',
    component: TermsAndConditions,
  },
  {
    path: '/accessibility',
    name: 'Accessibility Statement',
    component: Accessibility,
  },
  {
    path: '/faqs',
    name: 'FAQs',
    component: Faqs,
  },
  {
    path: '/ccrs',
    name: 'CCRs',
    component: Ccrs,
  },
  {
    path: '/board-members',
    name: 'Board Members',
    component: BoardMembers,
  },
  {
    path: '/board-minutes',
    name: 'Board Minutes',
    component: BoardMinutes,
  },
  {
    path: '/directory',
    name: 'Directory',
    component: Directory,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/callback',
    name: 'Callback',
    component: CallbackPage,
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedPage,
  },
  {
    path: '/portfolio/:slug',
    name: 'ProjectDetail',
    component: ProjectDetail,
  },
  {
    path: '/team-projects/:slug',
    name: 'TeamProjectDetail',
    component: TeamProjectDetail,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;

  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();

  if (isLoading.value) {
    await new Promise<void>((resolve) => {
      const unwatch = watchEffect(() => {
        if (!isLoading.value) { unwatch(); resolve(); }
      });
    });
  }

  if (!isAuthenticated.value) {
    try { sessionStorage.setItem('auth:targetUrl', to.fullPath); } catch { /* empty */ }
    loginWithRedirect({ appState: { targetUrl: to.fullPath } });
    return false;
  }

  if (!checkMember(user.value || {})) {
    return { name: 'Unauthorized' };
  }

  return true;
});

export default router;
