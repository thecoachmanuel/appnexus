"use client";

import { Globe, Wand2, Download, Rocket } from "lucide-react";
import AnimatedSection, { StaggerContainer, StaggerItem } from "@/components/AnimatedSection";

const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Enter Your Website URL",
    description: "Simply paste your website URL. Our AI analyzes your site structure and content automatically."
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI Configures Everything",
    description: "The AI assistant sets up navigation, colors, icons, and settings based on your website. You can customize anything."
  },
  {
    number: "03",
    icon: Download,
    title: "Build Your App",
    description: "One-click build generates your native app file. Preview it instantly in your browser or download for testing."
  },
  {
    number: "04",
    icon: Rocket,
    title: "Publish to App Stores",
    description: "Get signed app files ready for Google Play and App Store submission. QR codes for easy sharing."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/20" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
            <Wand2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Simple Process</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">From Website to App in</span>
            <br />
            <span className="text-primary">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            No coding, no complexity. Just enter your URL and let AI do the rest
          </p>
        </AnimatedSection>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block" />
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.15}>
            {steps.map((step) => (
              <StaggerItem key={step.number} className="relative group h-full">
                {/* Card */}
                <div className="glass-card rounded-2xl p-8 text-center hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                  {/* Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6 mt-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
