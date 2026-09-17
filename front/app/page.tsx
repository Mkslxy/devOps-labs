import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { CoursesSection } from "@/components/landing/courses-section"
import { TrialSection } from "@/components/landing/trial-section"
import { ContactForm } from "@/components/landing/contact-form"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CoursesSection />
        <TrialSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
