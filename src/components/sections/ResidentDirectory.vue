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
  return residents.value.filter((r) =>
    [r.firstname, r.lastname, r.nickname, r.address, r.email, r.organization]
      .some((v) => v && String(v).toLowerCase().includes(q)),
  );
});
const displayName = (r) => {
  const parts = [r.firstname, r.lastname].filter(Boolean).join(' ');
  return r.nickname ? `${parts} (${r.nickname})` : parts || '—';
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
            <tr v-for="r in filtered" :key="r._id" class="border-b border-[var(--color-border)] last:border-0">
              <td class="px-4 py-2 text-[var(--color-text)]">{{ displayName(r) }}</td>
              <td class="px-4 py-2 text-[var(--color-text-secondary)]">{{ r.address }}</td>
              <td class="px-4 py-2">
                <a v-if="r.email" :href="`mailto:${r.email}`" class="text-[var(--color-primary)] hover:underline">{{ r.email }}</a>
              </td>
              <td class="px-4 py-2">
                <a v-if="r.phone" :href="`tel:${r.phone}`" class="text-[var(--color-primary)] hover:underline">{{ r.phone }}</a>
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
