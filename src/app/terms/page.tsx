"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, AlertTriangle, Scale, CreditCard, Ban, Shield, Globe } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const Terms = () => {
  const lastUpdated = "January 8, 2026";
  const { settings } = useSystemSettings();
  const appName = settings.app_name;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 pt-24 sm:pt-28">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using {appName} ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service. 
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground">
                {appName} is a no-code platform that enables users to convert websites into native mobile 
                applications. Our Service includes app building tools, preview functionality, and app 
                publishing assistance. We reserve the right to modify, suspend, or discontinue any part 
                of the Service at any time.
              </p>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You may not use another user's account without permission</li>
                <li>We reserve the right to suspend accounts that violate these Terms</li>
              </ul>
            </CardContent>
          </Card>

          {/* Subscription and Payments */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">4. Subscription and Payments</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">Billing:</strong> Subscriptions are billed in advance on a monthly or annual basis.</p>
                <p><strong className="text-foreground">Refunds:</strong> Refunds are provided in accordance with applicable laws and our refund policy.</p>
                <p><strong className="text-foreground">Price Changes:</strong> We may change prices with 30 days' notice. Continued use constitutes acceptance.</p>
                <p><strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of your billing period.</p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">5. Acceptable Use</h2>
              </div>
              <p className="text-muted-foreground mb-2">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any intellectual property rights</li>
                <li>Transmit malware or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with other users' use of the Service</li>
                <li>Create apps that contain illegal or harmful content</li>
                <li>Resell the Service without authorization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by {appName} 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws. You retain ownership of the apps you create using our Service.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, {appName} shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including loss of profits, data, 
                or other intangible losses resulting from your use of the Service. Our total liability 
                shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">8. Governing Law</h2>
              </div>
              <p className="text-muted-foreground">
                These Terms shall be governed by the laws of [Your Jurisdiction], without regard to its 
                conflict of law provisions. For users in the European Union, mandatory consumer protection 
                laws of your country of residence will also apply.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of any changes 
                by posting the new Terms on this page and updating the "Last updated" date. Your continued 
                use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">10. Contact Information</h2>
              </div>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="text-muted-foreground">
                <p>Email: legal@{appName.toLowerCase().replace(/\s+/g, '')}.com</p>
                <p>Address: [Your Company Address]</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
