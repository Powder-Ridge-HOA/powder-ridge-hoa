<script setup>
import { computed, h, ref, watch, onMounted } from 'vue';
import { PortableText } from '@portabletext/vue';
import { sanityImage } from '@/composables/useSanityImage';
const props = defineProps({ section: { type: Object, default: null } });

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-01-01';

const committee = ref(props.section?.committee || null);
const loading = ref(false);
const error = ref(null);

async function loadByRef(ref_) {
  if (!ref_ || !projectId) return;
  loading.value = true;
  error.value = null;
  try {
    const query = `*[_id == "${ref_}"][0]{ _id, name, chairman, members, description, email, phone, image }`;
    const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
    url.searchParams.set('query', query);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
    const json = await res.json();
    if (json.result) committee.value = json.result;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function syncFromSection() {
  const s = props.section;
  if (!s) return;
  if (s.committee && typeof s.committee === 'object' && s.committee._id) {
    committee.value = s.committee;
  } else if (s.committee && s.committee._ref) {
    loadByRef(s.committee._ref);
  }
}

onMounted(syncFromSection);
watch(() => props.section, syncFromSection);

const photoUrl = (image) => {
  if (!image?.asset) return null;
  try { return sanityImage(image).width(900).height(600).fit('crop').url(); }
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
    <div class="max-w-5xl mx-auto">
      <div v-if="section?.heading" class="text-center mb-8">
        <h2 class="text-3xl font-bold text-[var(--color-text)]">{{ section.heading }}</h2>
        <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] mt-2">{{ section.subheading }}</p>
      </div>
      <p v-if="loading && !committee" class="text-center text-[var(--color-text-secondary)]">Loading committee…</p>
      <p v-else-if="error" class="text-center text-red-600">{{ error }}</p>
      <div v-else-if="committee" class="bg-[var(--color-surface)] rounded-lg shadow p-6 md:p-8 grid md:grid-cols-2 gap-6 items-start">
        <div>
          <img
            v-if="photoUrl(committee.image)"
            :src="photoUrl(committee.image)"
            :alt="`${committee.name} image`"
            class="w-full aspect-[3/2] object-cover rounded"
            loading="lazy"
          />
        </div>
        <div>
          <h3 class="text-2xl font-bold text-[var(--color-text)] mb-2">{{ committee.name }}</h3>
          <p v-if="committee.chairman" class="text-sm text-[var(--color-primary)] font-semibold mb-4">
            Chair: {{ committee.chairman }}
          </p>
          <div v-if="committee.description?.length" class="text-sm text-[var(--color-text-secondary)] space-y-3 mb-4">
            <PortableText :value="committee.description" :components="portableComponents" />
          </div>
          <div v-if="committee.members?.length" class="mb-4">
            <h4 class="text-sm font-semibold text-[var(--color-text)] mb-1">Members</h4>
            <ul class="text-sm text-[var(--color-text-secondary)] space-y-1">
              <li v-for="(m, i) in committee.members" :key="i">{{ m }}</li>
            </ul>
          </div>
          <div v-if="committee.email" class="text-sm">
            <a :href="`mailto:${committee.email}`" class="text-[var(--color-primary)] hover:underline">{{ committee.email }}</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
