"use client";

import { 
  Bot, 
  Palette, 
  Bell, 
  QrCode, 
  Shield, 
  Zap,
  Smartphone,
  Globe,
  CreditCard,
  FileText
} from "lucide-react";
import AnimatedSection, { StaggerContainer, StaggerItem } from "@/components/AnimatedSection";

const features = [
  {
    icon: Smartphone,
    title: "Look great on any device",
    description: "Your app looks and works great on any device, automatically. Responsive design built-in."
  },
  {
    icon: Globe,
    title: "Design with pre-built components",
    description: "Select from a growing library of components, including forms, calendars, and charts."
  },
  {
    icon: Palette,
    title: "Apply themes and layouts",
    description: "Quickly customize your app with color themes and layout presets. Make it truly yours."
  },
  {
    icon: Bot,
    title: "AI-Powered Builder",
    description: "Built-in AI assistant that automatically configures your app, suggests optimal settings, and guides you through the entire process."
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Send messages directly to app users. Keep them engaged with instant updates and announcements."
  },
  {
    icon: QrCode,
    title: "Instant Distribution",
    description: "Download app files or scan QR codes for instant testing. No app store approval needed for testing."
  },
  {
    icon: Shield,
    title: "GDPR Compliant",
    description: "Built with privacy in mind. Full GDPR compliance and privacy features for worldwide customers."
  },
  {
    icon: CreditCard,
    title: "Subscription Plans",
    description: "Offer Free, Pro, and Enterprise pricing tiers. Accept PayPal and Bank Transfer payments."
  },
  {
    icon: FileText,
    title: "Auto Invoicing",
    description: "Professional PDF invoices generated automatically for every transaction."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 bg-muted/20" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Powerful Features</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Everything You Need to</span>
            <br />
            <span className="text-primary">Build & Monetize</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            A complete SaaS platform with all the tools to create, customize, and sell mobile apps
          </p>
        </AnimatedSection>

        {/* Features Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
          {features.map((feature) => (
            <StaggerItem key={feature.title} className="h-full">
              <div className="group bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center mb-8 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default FeaturesSection;
