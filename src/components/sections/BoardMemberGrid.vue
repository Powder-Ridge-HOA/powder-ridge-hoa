<script setup>
import { h } from 'vue';
import { PortableText } from '@portabletext/vue';
import { sanityImage } from '@/composables/useSanityImage';
import { useCollection } from '@/composables/useCollection';
const props = defineProps({ section: { type: Object, default: null } });
const { data: members, loading, error } = useCollection(
  `*[_type == "boardMember"] | order(position asc){ _id, name, position, email, phone, description, image }`,
  () => props.section?.members,
);
const photoUrl = (image) => {
  if (!image?.asset) return null;
  try { return sanityImage(image).width(480).height(480).fit('crop').url(); }
  catch { return null; }
};
const portableComponents = {
  block: {
    normal: (_, { slots }) => h('p', { class: 'mb-3 last:mb-0' }, slots.default?.()),
  },
};
</script>

<template>
  <section class="reveal py-16 px-6 bg-[var(--color-bg)]">
    <div v-if="section?.heading || section?.subheading" class="max-w-5xl mx-auto text-center mb-12">
      <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
      <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
    </div>
    <p v-if="loading && !members.length" class="text-center text-[var(--color-text-secondary)]">Loading board members…</p>
    <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>
    <div v-else-if="members.length" class="reveal-stagger max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <article v-for="m in members" :key="m._id" class="bg-[var(--color-surface)] rounded-lg shadow p-6 text-center">
        <img
          v-if="photoUrl(m.image)"
          :src="photoUrl(m.image)"
          :alt="`Photo of ${m.name}`"
          class="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
          loading="lazy"
        />
        <div v-else class="w-32 h-32 rounded-full mx-auto mb-4 bg-[var(--color-bg-muted)] flex items-center justify-center text-2xl text-[var(--color-text-secondary)]">
          {{ (m.name || '?').charAt(0) }}
        </div>
        <h3 class="text-lg font-semibold text-[var(--color-text)]">{{ m.name }}</h3>
        <p v-if="m.position" class="text-sm text-[var(--color-primary)] font-medium mb-2">{{ m.position }}</p>
        <p v-if="m.email" class="text-sm text-[var(--color-text-secondary)] mb-3">
          <a :href="`mailto:${m.email}`" class="hover:underline">{{ m.email }}</a>
        </p>
        <div v-if="m.description?.length" class="text-sm text-[var(--color-text-secondary)] text-left mt-3 space-y-3">
          <PortableText :value="m.description" :components="portableComponents" />
        </div>
      </article>
    </div>
    <p v-else class="text-center text-[var(--color-text-secondary)]">No board members to display.</p>
  </section>
</template>
