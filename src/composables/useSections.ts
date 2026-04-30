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
import BoardMemberGrid from '@/components/sections/BoardMemberGrid.vue'
import CcrList from '@/components/sections/CcrList.vue'
import MinutesArchive from '@/components/sections/MinutesArchive.vue'
import ResidentDirectory from '@/components/sections/ResidentDirectory.vue'
import FaqList from '@/components/sections/FaqList.vue'
import CommitteePanel from '@/components/sections/CommitteePanel.vue'
import CommunityInfo from '@/components/sections/CommunityInfo.vue'
import MediaImage from '@/components/sections/MediaImage.vue'

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
  boardMemberGrid: BoardMemberGrid,
  ccrList: CcrList,
  minutesArchive: MinutesArchive,
  residentDirectory: ResidentDirectory,
  faqList: FaqList,
  committeePanel: CommitteePanel,
  communityInfo: CommunityInfo,
  mediaImage: MediaImage,
}

/** Section-type projections that pull in collection data via GROQ */
const sectionProjection = `
  sections[]{
    ...,
    _type == "boardMemberGrid" => {
      ...,
      "members": *[_type == "boardMember"] | order(position asc){
        _id, name, position, email, phone, description, image
      }
    },
    _type == "ccrList" => {
      ...,
      "ccrs": *[_type == "ccr"] | order(refId asc){
        _id, ccr, refId, refIdDisplay, ccrContent
      }
    },
    _type == "minutesArchive" => {
      ...,
      "minutes": *[_type == "boardMinutes"] | order(meetingStart desc){
        _id, title, meetingStart, endTime, teleconference, tags,
        oldBusiness, newBusiness, treasurersReport
      }
    },
    _type == "faqList" => {
      ...,
      "faqs": *[_type == "faq"] | order(_createdAt asc){
        _id, question, answer
      }
    },
    _type == "committeePanel" => {
      ...,
      committee->{
        _id, name, chairman, members, description, email, phone, image
      }
    }
  }
`

/** GROQ query — fetches the page doc and inlines collection data for dynamic sections */
export const pageQuery = (slug: string) =>
  `*[_type == "page" && slug.current == "${slug}"][0]{ title, "slug": slug.current, ${sectionProjection} }`
