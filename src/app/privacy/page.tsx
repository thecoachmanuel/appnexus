"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Globe, Database, Lock, Users, FileText, Clock } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const Privacy = () => {
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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
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
              <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
              <p className="text-muted-foreground">
                {appName} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                website and services. We comply with the General Data Protection Regulation (GDPR) and 
                other applicable data protection laws.
              </p>
            </CardContent>
          </Card>

          {/* Data We Collect */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Data We Collect</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">Personal Information:</strong> Email address, name, company name, and profile information you provide.</p>
                <p><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our services, including pages visited, features used, and time spent.</p>
                <p><strong className="text-foreground">Technical Data:</strong> IP address, browser type, device information, and operating system.</p>
                <p><strong className="text-foreground">Cookie Data:</strong> Information collected through cookies and similar tracking technologies (see our Cookie Policy).</p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Data */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">How We Use Your Data</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide, maintain, and improve our services</li>
                <li>To process your transactions and manage your account</li>
                <li>To send you service-related communications</li>
                <li>To send marketing communications (with your consent)</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights (GDPR) */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Your Rights Under GDPR</h2>
              </div>
              <div className="grid gap-3 text-muted-foreground">
                <p><strong className="text-foreground">Right to Access:</strong> You can request a copy of your personal data.</p>
                <p><strong className="text-foreground">Right to Rectification:</strong> You can request correction of inaccurate data.</p>
                <p><strong className="text-foreground">Right to Erasure:</strong> You can request deletion of your personal data.</p>
                <p><strong className="text-foreground">Right to Data Portability:</strong> You can request your data in a machine-readable format.</p>
                <p><strong className="text-foreground">Right to Object:</strong> You can object to processing of your personal data.</p>
                <p><strong className="text-foreground">Right to Withdraw Consent:</strong> You can withdraw consent at any time.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                To exercise any of these rights, visit your Settings page or contact us at privacy@{appName.toLowerCase().replace(/\s+/g, '')}.com.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Data Security</h2>
              </div>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal data 
                against unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                secure servers, and regular security assessments.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">International Data Transfers</h2>
              </div>
              <p className="text-muted-foreground">
                Your data may be transferred to and processed in countries outside your country of residence. 
                We ensure appropriate safeguards are in place, such as Standard Contractual Clauses, to 
                protect your data in accordance with GDPR requirements.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal data only for as long as necessary to fulfill the purposes for which 
                it was collected, including legal, accounting, or reporting requirements. When you delete 
                your account, we remove your personal data within 30 days, except where retention is required 
                by law.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
              </div>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact our Data Protection Officer at:
              </p>
              <div className="text-muted-foreground">
                <p>Email: privacy@{appName.toLowerCase().replace(/\s+/g, '')}.com</p>
                <p>Address: [Your Company Address]</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You also have the right to lodge a complaint with your local supervisory authority.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
