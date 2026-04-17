import type { Component } from 'vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import FeatureGrid from '@/components/sections/FeatureGrid.vue'
import StatsSection from '@/components/sections/StatsSection.vue'
import ProcessSteps from '@/components/sections/ProcessSteps.vue'
import TestimonialsSection from '@/components/sections/TestimonialsSection.vue'
import PricingSection from '@/components/sections/PricingSection.vue'
import PricingCtaSection from '@/components/sections/PricingCtaSection.vue'
import FaqSection from '@/components/sections/FaqSection.vue'
import SplitSection from '@/components/sections/SplitSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import TextContent from '@/components/sections/TextContent.vue'
import PortfolioSection from '@/components/sections/PortfolioSection.vue'
import TeamProjectsSection from '@/components/sections/TeamProjectsSection.vue'

/** Maps section _type (from Sanity) to Vue components */
export const sectionMap: Record<string, Component> = {
  heroSection: HeroSection,
  featureGrid: FeatureGrid,
  statsSection: StatsSection,
  processSteps: ProcessSteps,
  testimonialsSection: TestimonialsSection,
  pricingSection: PricingSection,
  pricingCtaSection: PricingCtaSection,
  faqSection: FaqSection,
  splitSection: SplitSection,
  contactSection: ContactSection,
  textContent: TextContent,
  portfolioSection: PortfolioSection,
  teamProjectsSection: TeamProjectsSection,
}

/** GROQ query — just fetch the whole page document with sections */
export const pageQuery = (slug: string) =>
  `*[_type == "page" && slug.current == "${slug}"][0]{ title, "slug": slug.current, sections }`
