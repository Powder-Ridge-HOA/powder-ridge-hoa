<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
const props = defineProps({ section: { type: Object, default: null } });

const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

const residents = ref([]);
const loading = ref(true);
const error = ref(null);
const query = ref('');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const token = await getAccessTokenSilently();
    const res = await fetch('/.netlify/functions/residents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let bodyMsg = '';
      try {
        const body = await res.clone().json();
        if (body?.error) bodyMsg = ` — ${body.error}`;
      } catch {
        try { bodyMsg = ' — ' + (await res.clone().text()).slice(0, 200); } catch { /* empty */ }
      }
      if (res.status === 401 || res.status === 403) {
        error.value = `You do not have access to the resident directory.${bodyMsg}`;
      } else {
        error.value = `Unable to load directory (${res.status}).${bodyMsg}`;
      }
      return;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // In `vite dev` the /.netlify/functions/* path 404s in a way that
      // returns index.html (SPA fallback) with a 200. Detect that and
      // surface a dev-friendly message instead of choking on JSON.parse.
      error.value = 'Directory API is not available on this server. Run `netlify dev` (not `vite`) to serve the Netlify Function locally.';
      return;
    }
    const json = await res.json();
    residents.value = Array.isArray(json.residents) ? json.residents : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!isLoading.value && isAuthenticated.value) load();
});
watch(
  () => [isLoading.value, isAuthenticated.value],
  ([l, a]) => { if (!l && a) load(); },
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return residents.value;
  return residents.value.filter((r) => {
    const haystack = [r.firstname, r.lastname, r.nickname, r.address, r.email, r.organization];
    if (Array.isArray(r.additionalContacts)) {
      for (const c of r.additionalContacts) {
        haystack.push(c?.name, c?.email, c?.phone);
      }
    }
    return haystack.some((v) => v && String(v).toLowerCase().includes(q));
  });
});
const displayName = (r) => {
  const parts = [r.firstname, r.lastname].filter(Boolean).join(' ');
  return r.nickname ? `${parts} (${r.nickname})` : parts || '—';
};
const formatPhone = (raw) => {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') return formatPhone(d.slice(1));
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
};
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading || section?.subheading" class="max-w-5xl mx-auto text-center mb-8">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
      <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
    </div>

    <p v-if="loading" class="text-center text-[var(--color-text-secondary)]">Loading directory…</p>
    <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>

    <template v-else>
      <div class="max-w-5xl mx-auto mb-6">
        <input
          v-model="query"
          type="search"
          placeholder="Search residents..."
          class="w-full px-4 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          aria-label="Search residents"
        />
      </div>
      <div v-if="filtered.length" class="max-w-5xl mx-auto overflow-x-auto">
        <table class="w-full text-sm bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
          <thead>
            <tr class="text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <th class="px-4 py-2 font-medium">Name</th>
              <th class="px-4 py-2 font-medium">Address</th>
              <th class="px-4 py-2 font-medium">Email</th>
              <th class="px-4 py-2 font-medium">Phone</th>
              <th class="px-4 py-2 font-medium">Organization</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r._id" class="border-b border-[var(--color-border)] last:border-0 align-top">
              <td class="px-4 py-2 text-[var(--color-text)]">
                <div>{{ displayName(r) }}</div>
                <div
                  v-for="(c, i) in (r.additionalContacts || [])"
                  :key="`name-${i}`"
                  class="text-xs text-[var(--color-text-secondary)] mt-1"
                >
                  {{ c.name || '—' }}
                </div>
              </td>
              <td class="px-4 py-2 text-[var(--color-text-secondary)]">{{ r.address }}</td>
              <td class="px-4 py-2">
                <div v-if="r.email">
                  <a :href="`mailto:${r.email}`" class="text-[var(--color-primary)] hover:underline">{{ r.email }}</a>
                </div>
                <div
                  v-for="(c, i) in (r.additionalContacts || [])"
                  :key="`email-${i}`"
                  class="text-xs mt-1"
                >
                  <a v-if="c.email" :href="`mailto:${c.email}`" class="text-[var(--color-primary)] hover:underline">{{ c.email }}</a>
                </div>
              </td>
              <td class="px-4 py-2">
                <div v-if="r.phone">
                  <a :href="`tel:${r.phone}`" class="text-[var(--color-primary)] hover:underline">{{ formatPhone(r.phone) }}</a>
                </div>
                <div
                  v-for="(c, i) in (r.additionalContacts || [])"
                  :key="`phone-${i}`"
                  class="text-xs mt-1"
                >
                  <a v-if="c.phone" :href="`tel:${c.phone}`" class="text-[var(--color-primary)] hover:underline">{{ formatPhone(c.phone) }}</a>
                </div>
              </td>
              <td class="px-4 py-2 text-[var(--color-text-secondary)]">{{ r.organization }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-center text-[var(--color-text-secondary)]">No residents match your search.</p>
    </template>
  </section>
</template>
