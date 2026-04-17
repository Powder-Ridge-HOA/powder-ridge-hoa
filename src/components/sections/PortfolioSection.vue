<script setup>
import { RouterLink } from 'vue-router';
import { sanityImage } from '@/composables/useSanityImage';
import { useProjects } from '@/composables/useProjects';

defineProps({ section: { type: Object, default: null } });

const { projects, loading, error } = useProjects('caseStudy');
</script>

<template>
  <section class="py-16 px-6 bg-[var(--color-surface)]">
    <div class="max-w-6xl mx-auto">
      <div v-if="section?.heading || section?.subheading" class="text-center mb-12">
        <h2 v-if="section?.heading" class="text-3xl font-bold text-[var(--color-text)] mb-3">{{ section.heading }}</h2>
        <p v-if="section?.subheading" class="text-[var(--color-text-secondary)] text-base max-w-2xl mx-auto">{{ section.subheading }}</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-[var(--color-text-secondary)] text-sm">Loading projects...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500 text-sm">{{ error }}</p>
      </div>

      <div v-else-if="!projects.length" class="text-center py-12">
        <p class="text-[var(--color-text-secondary)] text-sm">No projects to show yet.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <RouterLink
          v-for="p in projects"
          :key="p.slug"
          :to="`/portfolio/${p.slug}`"
          class="group bg-[var(--color-bg)] rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm hover:shadow-lg transition-shadow focus-ring"
        >
          <div class="h-40 overflow-hidden">
            <img
              v-if="p.image"
              :src="sanityImage(p.image).width(600).height(320).fit('crop').auto('format').url()"
              :alt="p.imageAlt || p.title"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center">
              <img v-if="p.logo" :src="sanityImage(p.logo).width(80).height(80).fit('crop').url()" :alt="p.title" loading="lazy" class="w-12 h-12 rounded-lg object-contain" />
            </div>
          </div>
          <div class="relative">
            <span v-if="p.category" class="absolute -top-3 left-4 text-[0.8125rem] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-0.5 rounded-full">{{ p.category }}</span>
          </div>
          <div class="p-5 pt-4">
            <h3 class="font-bold text-[var(--color-text)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">{{ p.title }}</h3>
            <p v-if="p.description" class="text-[var(--color-text-secondary)] text-sm leading-relaxed">{{ p.description }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
