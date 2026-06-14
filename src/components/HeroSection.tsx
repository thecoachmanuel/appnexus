"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Globe, Zap } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useEffect } from "react";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for mouse follow
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  // Different movement intensities for each orb (parallax depth)
  const orb1X = useTransform(smoothMouseX, [-0.5, 0.5], [-40, 40]);
  const orb1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-40, 40]);
  const orb2X = useTransform(smoothMouseX, [-0.5, 0.5], [30, -30]);
  const orb2Y = useTransform(smoothMouseY, [-0.5, 0.5], [30, -30]);
  const orb3X = useTransform(smoothMouseX, [-0.5, 0.5], [-20, 20]);
  const orb3Y = useTransform(smoothMouseY, [-0.5, 0.5], [-25, 25]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Normalize to -0.5 to 0.5 range
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const gradientScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const floatingY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Radial Gradient Background with Parallax */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        {/* Primary radial gradient with mouse follow */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1200px] md:h-[1200px]"
          style={{ scale: gradientScale, x: orb1X, y: orb1Y }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,_hsl(var(--primary)_/_0.15)_0%,_transparent_70%)]" />
        </motion.div>
        
        {/* Secondary radial gradient with mouse follow */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] md:w-[900px] md:h-[900px]"
          style={{ scale: gradientScale, x: orb2X, y: orb2Y }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,_hsl(var(--primary)_/_0.08)_0%,_transparent_60%)]" />
        </motion.div>

        {/* Accent gradient glow with mouse follow */}
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] md:w-[600px] md:h-[600px]"
          style={{ scale: gradientScale, x: orb3X, y: orb3Y }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,_hsl(var(--muted-foreground)_/_0.05)_0%,_transparent_50%)]" />
        </motion.div>
      </motion.div>

      {/* Background Base */}
      <div className="absolute inset-0 bg-muted/20" />
      
      {/* Grid Pattern with Parallax */}
      <motion.div 
        className="absolute inset-0 bg-[linear-gradient(to_right,_hsl(var(--border)_/_0.3)_1px,_transparent_1px),_linear-gradient(to_bottom,_hsl(var(--border)_/_0.3)_1px,_transparent_1px)] bg-[size:60px_60px]"
        style={{ y: backgroundY }}
      />

      {/* Animated gradient orbs with mouse follow */}
      <motion.div 
        className="absolute top-20 right-1/4 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        style={{ x: orb1X, y: orb1Y }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-40 left-1/4 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"
        style={{ x: orb2X, y: orb2Y }}
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-primary/8 blur-2xl pointer-events-none"
        style={{ x: orb3X, y: orb3Y }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      <motion.div 
        className="container mx-auto px-6 relative z-10"
        style={{ y: contentY }}
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">AI-Powered No-Code App Builder</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          >
            <span className="text-foreground">Convert Websites to</span>
            <br />
            <span className="text-primary">Native Mobile Apps</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            Enter your website URL and create professional native apps in 5 minutes. 
            No coding needed. AI handles everything automatically.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button variant="accent" size="xl" className="group" asChild>
              <Link href="/builder?new=true">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" className="group">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-display font-bold text-primary mb-1">50K+</div>
              <div className="text-muted-foreground text-sm">Apps Created</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-display font-bold text-primary mb-1">5 Min</div>
              <div className="text-muted-foreground text-sm">Average Build Time</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-display font-bold text-primary mb-1">99.9%</div>
              <div className="text-muted-foreground text-sm">Uptime SLA</div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements with Parallax */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          style={{ y: floatingY }}
          className="absolute top-1/3 left-10 hidden lg:block"
        >
          <motion.div 
            className="glass-card p-4 rounded-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Globe className="w-8 h-8 text-primary" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          style={{ y: floatingY }}
          className="absolute top-1/2 right-10 hidden lg:block"
        >
          <motion.div 
            className="glass-card p-4 rounded-2xl"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Zap className="w-8 h-8 text-accent" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
