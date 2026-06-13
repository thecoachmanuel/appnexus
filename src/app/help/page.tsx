"use client";

import { useState } from 'react';
import Link from "next/link";
import { 
  Book, 
  Smartphone, 
  Zap, 
  CreditCard, 
  Shield, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Search,
  Camera,
  Fingerprint,
  Vibrate,
  Bell,
  Download,
  Globe,
  Palette,
  FileText,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const getHelpCategories = (appName: string) => [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    description: `Learn the basics of ${appName}`,
    articles: [
      { title: `What is ${appName}?`, content: `${appName} is an AI-powered no-code platform that converts any website into a native mobile app for iOS and Android. Simply enter your website URL, customize your app settings, and build a professional mobile application in minutes.` },
      { title: 'Creating Your First App', content: 'To create your first app:\n\n1. Navigate to the App Builder\n2. Enter your website URL\n3. Configure app settings (name, colors, icon)\n4. Select your target platform (Android/iOS)\n5. Click Build to generate your app' },
      { title: 'Understanding the Dashboard', content: 'The Dashboard provides an overview of all your projects, recent builds, and quick actions. You can manage your apps, view build history, and access settings from here.' },
    ]
  },
  {
    id: 'app-builder',
    title: 'App Builder',
    icon: Smartphone,
    description: 'Build and customize your apps',
    articles: [
      { title: 'App Configuration Options', content: 'Customize your app with:\n\n• App Name & Package ID\n• Primary & Accent Colors\n• Custom App Icon\n• Splash Screen Design\n• Navigation Style\n• Feature Selection (Push Notifications, Camera, etc.)' },
      { title: 'Choosing the Right Template', content: `${appName} offers preset templates optimized for different use cases:\n\n• E-commerce: Product catalogs and shopping\n• Blog/News: Content-focused layouts\n• Business: Professional service apps\n• Social: Community and engagement features` },
      { title: 'Platform-Specific Settings', content: 'Each platform has unique requirements:\n\n• Android: Package name format (com.example.app)\n• iOS: Bundle ID and App Store requirements\n• Both: Icon sizes, splash screens, and permissions' },
    ]
  },
  {
    id: 'native-features',
    title: 'Native Features',
    icon: Zap,
    description: 'Camera, biometrics, haptics & more',
    articles: [
      { title: 'Camera Integration', content: 'Enable camera access in your app to:\n\n• Capture photos directly\n• Select images from gallery\n• Scan QR codes and barcodes\n\nRequires enabling the Camera feature in app configuration.' },
      { title: 'Biometric Authentication', content: 'Secure your app with biometric authentication:\n\n• Face ID (iOS)\n• Touch ID (iOS)\n• Fingerprint (Android)\n• Face Recognition (Android)\n\nProvides an extra layer of security for sensitive operations.' },
      { title: 'Haptic Feedback', content: 'Enhance user experience with tactile feedback:\n\n• Impact styles: Light, Medium, Heavy\n• Notification types: Success, Warning, Error\n• Custom vibration patterns\n\nHaptics work on supported iOS and Android devices.' },
      { title: 'Push Notifications', content: 'Keep users engaged with push notifications:\n\n• Send updates and alerts\n• Promotional messages\n• Transaction confirmations\n\nRequires push notification certificates for iOS and Firebase setup for Android.' },
    ]
  },
  {
    id: 'subscription',
    title: 'Plans & Credits',
    icon: CreditCard,
    description: 'Billing, credits, and subscriptions',
    articles: [
      { title: 'Understanding Credits', content: 'Credits are used to build apps:\n\n• Each build consumes credits based on complexity\n• Monthly credits reset with your billing cycle\n• Bonus credits never expire\n• Purchase credit packs for additional builds' },
      { title: 'Subscription Plans', content: 'Choose the plan that fits your needs:\n\n• Free: Limited builds to try the platform\n• Pro: More credits and features for individuals\n• Enterprise: Unlimited builds for teams\n\nUpgrade or downgrade anytime.' },
      { title: 'Payment Methods', content: 'We accept multiple payment methods:\n\n• Credit/Debit Cards (via Stripe)\n• Bank Transfer\n• PayPal\n• Cryptocurrency' },
    ]
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: Settings,
    description: 'Profile, security, preferences',
    articles: [
      { title: 'Profile Settings', content: 'Manage your account:\n\n• Update display name and avatar\n• Change email address\n• Set company information\n• Configure notification preferences' },
      { title: 'Security Settings', content: 'Keep your account secure:\n\n• Change password\n• Enable two-factor authentication\n• Review login history\n• Manage connected devices' },
      { title: 'Notification Preferences', content: 'Control how you receive updates:\n\n• Email notifications\n• Browser push notifications\n• Sound alerts for build completion\n• Marketing communications' },
    ]
  },
];

const getFaqs = (appName: string) => [
  {
    question: 'How long does it take to build an app?',
    answer: 'Build times vary based on app complexity and selected features. Simple apps typically take 5-10 minutes, while apps with advanced features may take 15-20 minutes.'
  },
  {
    question: 'Can I publish my app to the App Store and Play Store?',
    answer: `Yes! ${appName} generates production-ready APK (Android) and IPA (iOS) files that you can submit to Google Play Store and Apple App Store respectively.`
  },
  {
    question: 'Do I need coding experience?',
    answer: `No coding required! ${appName} is a no-code platform designed for everyone. Simply enter your website URL and customize your app using our visual interface.`
  },
  {
    question: `What websites work best with ${appName}?`,
    answer: `${appName} works with any responsive website. For best results, ensure your website is mobile-friendly and uses modern web technologies.`
  },
  {
    question: 'Can I update my app after publishing?',
    answer: 'Absolutely! You can rebuild your app anytime with updated content or settings. Each rebuild uses credits from your account.'
  },
  {
    question: 'What happens if my build fails?',
    answer: 'If a build fails, you will not be charged credits. Review the error message, adjust your settings, and try again. Contact support if issues persist.'
  },
];
const Help = () => {
  const { settings } = useSystemSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const helpCategories = getHelpCategories(settings.app_name);
  const faqs = getFaqs(settings.app_name);

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedCategory = helpCategories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers, learn features, and get the most out of {settings.app_name}
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto mt-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {activeCategory ? (
            // Category Detail View
            <div className="max-w-4xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={() => setActiveCategory(null)}
                className="mb-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Help Center
              </Button>

              {selectedCategory && (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <selectedCategory.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">{selectedCategory.title}</h2>
                      <p className="text-muted-foreground">{selectedCategory.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedCategory.articles.map((article, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground whitespace-pre-line">
                            {article.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Category Grid View
            <>
              {/* Quick Links */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <Link href="/builder">
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <span className="font-medium">Start Building</span>
                    </CardContent>
                  </Card>
                </Link>
                <a href="/docs/index.html">
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Book className="h-5 w-5 text-primary" />
                      <span className="font-medium">Documentation</span>
                    </CardContent>
                  </Card>
                </a>
                <Link href="/dashboard">
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-medium">My Projects</span>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Categories */}
              <h2 className="text-xl font-display font-semibold mb-6">Browse by Topic</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {filteredCategories.map((category) => (
                  <Card 
                    key={category.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <category.icon className="h-5 w-5 text-primary" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <CardTitle className="mt-4">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {category.articles.length} articles
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* FAQ Section */}
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-display font-bold text-center mb-8">
                  Frequently Asked Questions
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Contact Support */}
              <Card className="max-w-2xl mx-auto mt-16 bg-primary/5 border-primary/20">
                <CardContent className="p-8 text-center">
                  <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-display font-semibold mb-2">
                    Still need help?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Our support team is here to assist you with any questions.
                  </p>
                  <Button variant="hero" size="lg">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
