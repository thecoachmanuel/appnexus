"use client";

import AnimatedSection, { StaggerContainer, StaggerItem } from "./AnimatedSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const getTestimonials = (appName: string) => [
  {
    name: "Sarah Chen",
    role: "Startup Founder",
    company: "TechFlow",
    avatar: "",
    content: `${appName} transformed our web app into a native mobile experience in just minutes. The quality exceeded our expectations.`,
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "ScaleUp Inc",
    avatar: "",
    content: "We saved months of development time and thousands in costs. Our app is now live on both iOS and Android stores.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "CTO",
    company: "DigitalFirst",
    avatar: "",
    content: "The automation features are incredible. Push notifications, offline mode—everything just works out of the box.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Solo Developer",
    company: "Indie Apps",
    avatar: "",
    content: `As a solo developer, ${appName} lets me compete with bigger teams. I've launched 3 apps this year alone.`,
    rating: 5,
  },
  {
    name: "Amanda Foster",
    role: "Marketing Director",
    company: "BrandBoost",
    avatar: "",
    content: "Our client engagement increased 40% after launching the mobile app. The ROI has been phenomenal.",
    rating: 5,
  },
  {
    name: "James Wright",
    role: "Agency Owner",
    company: "WebCraft Studio",
    avatar: "",
    content: `We now offer mobile app development as a service to our clients. ${appName} is a game-changer for agencies.`,
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const { settings } = useSystemSettings();
  const testimonials = getTestimonials(settings.app_name);
  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Loved by Thousands
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what our customers are saying about their experience with {settings.app_name}
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <div className="glass-card rounded-2xl p-6 h-full flex flex-col border border-border/50 hover:border-primary/20 transition-colors">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                
                <p className="text-foreground/90 mb-6 flex-grow leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TestimonialsSection;
