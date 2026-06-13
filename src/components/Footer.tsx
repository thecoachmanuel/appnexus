"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import ThemeAwareLogo from "@/components/ThemeAwareLogo";

const Footer = () => {
  const { settings } = useSystemSettings();

  return (
    <footer className="border-t border-border py-16 pb-28 md:pb-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <ThemeAwareLogo className="w-10 h-10 rounded-xl" />
              <span className="font-display text-xl font-bold text-foreground">{settings.app_name}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              AI-powered no-code platform to convert any website into a native mobile app.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Features</a></li>
              <li><a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Pricing</a></li>
              <li><a href="/#platforms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Platforms</a></li>
              <li><Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Help Center</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">GDPR</Link></li>
              <li><Link href="/privacy#cookies" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {settings.app_name}. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm">
            Made with ❤️ by <a href="https://wrapcoders.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">WRAPCODERS</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
