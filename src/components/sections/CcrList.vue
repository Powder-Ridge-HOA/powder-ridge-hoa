<script setup>
import { computed, ref } from 'vue';
import { useCollection } from '@/composables/useCollection';
const props = defineProps({ section: { type: Object, default: null } });

const { data: ccrs, loading, error } = useCollection(
  `*[_type == "ccr"] | order(refId asc){ _id, ccr, refId, refIdDisplay, ccrContent }`,
  () => props.section?.ccrs,
);

const query = ref('');
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return ccrs.value;
  return ccrs.value.filter((c) =>
    [c.ccr, c.refIdDisplay, c.ccrContent].some((v) => v && String(v).toLowerCase().includes(q)),
  );
});
const open = ref(new Set());
const toggle = (id) => {
  const next = new Set(open.value);
  next.has(id) ? next.delete(id) : next.add(id);
  open.value = next;
};
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading || section?.subheading" class="max-w-4xl mx-auto text-center mb-8">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
      <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
    </div>
    <p v-if="loading && !ccrs.length" class="text-center text-[var(--color-text-secondary)]">Loading CCRs…</p>
    <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>
    <template v-else>
      <div class="max-w-4xl mx-auto mb-6">
        <input
          v-model="query"
          type="search"
          placeholder="Search CCRs..."
          class="w-full px-4 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          aria-label="Search CCRs"
        />
      </div>
      <ul v-if="filtered.length" class="max-w-4xl mx-auto space-y-2">
        <li v-for="c in filtered" :key="c._id" class="bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
          <button
            type="button"
            class="w-full text-left px-4 py-3 flex justify-between items-center gap-4"
            :aria-expanded="open.has(c._id)"
            @click="toggle(c._id)"
          >
            <span class="flex-1">
              <span v-if="c.refIdDisplay || c.refId" class="text-sm font-mono text-[var(--color-text-secondary)] mr-2">{{ c.refIdDisplay || c.refId }}</span>
              <span class="font-medium text-[var(--color-text)]">{{ c.ccr }}</span>
            </span>
            <span class="text-[var(--color-text-secondary)]" aria-hidden="true">{{ open.has(c._id) ? '−' : '+' }}</span>
          </button>
          <div v-if="open.has(c._id)" class="px-4 pb-4 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{{ c.ccrContent }}</div>
        </li>
      </ul>
      <p v-else-if="!query" class="text-center text-[var(--color-text-secondary)]">No CCRs available.</p>
      <p v-else class="text-center text-[var(--color-text-secondary)]">No CCRs match your search.</p>
    </template>
  </section>
</template>
