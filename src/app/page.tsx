"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import PlatformsSection from "@/components/PlatformsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const Index = () => {
  const { settings } = useSystemSettings();

  useEffect(() => {
    document.title = `${settings.app_name} - ${settings.app_tagline}`;
  }, [settings.app_name, settings.app_tagline]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <PlatformsSection />
      <CTASection />
      <Footer />
      <BackToTop />
    </main>
  );
};

export default Index;
