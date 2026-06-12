"use client";

import { Smartphone, Monitor, Laptop, Tablet, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AnimatedSection, { StaggerContainer, StaggerItem } from "@/components/AnimatedSection";

const platforms = [
  {
    icon: Smartphone,
    name: "Android",
    status: "Available Now",
    description: "Generate native Android apps ready for Google Play Store",
    available: true
  },
  {
    icon: Tablet,
    name: "WordPress",
    status: "Plugin Available",
    description: "Dedicated plugin for WordPress blogs and websites",
    available: true
  },
  {
    icon: Monitor,
    name: "iOS",
    status: "Available Now",
    description: "Native iPhone and iPad apps for the App Store",
    available: true
  },
  {
    icon: Laptop,
    name: "Windows",
    status: "Available Now",
    description: "Desktop apps for Windows PCs",
    available: true
  }
];

const PlatformsSection = () => {
  return (
    <section id="platforms" className="py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--primary)_/_0.05)_0%,_transparent_50%)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
            <Smartphone className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Multi-Platform</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Build for</span>
            <br />
            <span className="gradient-text">Every Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Build native apps for Android, iOS, Windows, and WordPress with our modular architecture
          </p>
        </AnimatedSection>

        {/* Platforms Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {platforms.map((platform) => (
            <StaggerItem key={platform.name} className="h-full">
              <div className="glass-card rounded-2xl p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 h-full flex flex-col">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                  <platform.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                
                {/* Status Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-primary/20 text-primary mx-auto">
                  {platform.status}
                </div>
                
                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {platform.name}
                </h3>
                <p className="text-muted-foreground text-sm flex-1 mb-6">
                  {platform.description}
                </p>
                
                {/* CTA Button */}
                <Button asChild variant="outline" size="sm" className="w-full group">
                  <Link to="/builder">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default PlatformsSection;
