<script setup>
import { ref } from 'vue';
import { PortableText } from '@portabletext/vue';
import { useCollection } from '@/composables/useCollection';
const props = defineProps({ section: { type: Object, default: null } });
const { data: faqs, loading, error } = useCollection(
  `*[_type == "faq"] | order(_createdAt asc){ _id, question, answer }`,
  () => props.section?.faqs,
);
const open = ref(new Set());
const toggle = (id) => {
  const next = new Set(open.value);
  next.has(id) ? next.delete(id) : next.add(id);
  open.value = next;
};
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading || section?.subheading" class="max-w-3xl mx-auto text-center mb-8">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
      <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
    </div>
    <p v-if="loading && !faqs.length" class="text-center text-[var(--color-text-secondary)]">Loading FAQs…</p>
    <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>
    <ul v-else-if="faqs.length" class="max-w-3xl mx-auto space-y-2">
      <li v-for="f in faqs" :key="f._id" class="bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
        <button
          type="button"
          class="w-full text-left px-4 py-3 flex justify-between items-center gap-4"
          :aria-expanded="open.has(f._id)"
          @click="toggle(f._id)"
        >
          <span class="font-medium text-[var(--color-text)]">{{ f.question }}</span>
          <span class="text-[var(--color-text-secondary)]" aria-hidden="true">{{ open.has(f._id) ? '−' : '+' }}</span>
        </button>
        <div v-if="open.has(f._id)" class="px-4 pb-4 text-sm text-[var(--color-text-secondary)] space-y-3">
          <PortableText v-if="f.answer?.length" :value="f.answer" />
        </div>
      </li>
    </ul>
    <p v-else class="text-center text-[var(--color-text-secondary)]">No frequently asked questions yet.</p>
  </section>
</template>
