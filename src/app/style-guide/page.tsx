"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonListItem,
  SkeletonList,
  SkeletonStats,
  SkeletonStatsGrid,
  SkeletonForm,
  SkeletonPageHeader,
  SkeletonPage,
} from "@/components/ui/content-skeleton";
import ShimmerSkeleton from "@/components/builder/configure/ShimmerSkeleton";

const StyleGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-padding pt-24 sm:pt-28 pb-16">
        <div className="max-w-6xl mx-auto stack-xl">
          {/* Header */}
          <div className="text-center stack-md">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Design System
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Fully monochromatic design system. Primary (#121212 light / #ffffff dark) is used for all interactive elements. No separate accent color.
            </p>
          </div>

          {/* Colors Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Colors</h2>
            
            {/* Primary & Accent */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Core Colors (Monochromatic)</h3>
              <p className="text-sm text-muted-foreground">Primary and Accent are identical - fully monochromatic scheme.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-grid">
                <ColorSwatch 
                  name="Primary" 
                  variable="--primary: 0 0% 7% (light) / 0 0% 100% (dark)" 
                  className="bg-primary" 
                  textClass="text-primary-foreground"
                />
                <ColorSwatch 
                  name="Accent (= Primary)" 
                  variable="--accent: same as primary" 
                  className="bg-primary" 
                  textClass="text-primary-foreground"
                />
                <ColorSwatch 
                  name="Foreground" 
                  variable="--foreground" 
                  className="bg-foreground" 
                  textClass="text-background"
                />
                <ColorSwatch 
                  name="Muted Foreground" 
                  variable="--muted-foreground" 
                  className="bg-muted-foreground" 
                  textClass="text-background"
                />
              </div>
            </div>

            {/* Surface Colors */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Surface Colors (Light/Dark)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-grid">
                <ColorSwatch 
                  name="Background" 
                  variable="Light: #fff / Dark: #0a0a0a" 
                  className="bg-background border" 
                  textClass="text-foreground"
                />
                <ColorSwatch 
                  name="Card" 
                  variable="Light: #fff / Dark: #121212" 
                  className="bg-card border" 
                  textClass="text-card-foreground"
                />
                <ColorSwatch 
                  name="Muted" 
                  variable="Light: #f5f5f5 / Dark: #1a1a1a" 
                  className="bg-muted" 
                  textClass="text-muted-foreground"
                />
                <ColorSwatch 
                  name="Border" 
                  variable="Light: #e5e5e5 / Dark: #262626" 
                  className="bg-border" 
                  textClass="text-foreground"
                />
              </div>
            </div>

            {/* UI Colors */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">UI Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-grid">
                <ColorSwatch 
                  name="Secondary" 
                  variable="--secondary" 
                  className="bg-secondary" 
                  textClass="text-secondary-foreground"
                />
                <ColorSwatch 
                  name="Destructive" 
                  variable="--destructive" 
                  className="bg-destructive" 
                  textClass="text-destructive-foreground"
                />
                <ColorSwatch 
                  name="Border" 
                  variable="--border" 
                  className="bg-border" 
                  textClass="text-foreground"
                />
                <ColorSwatch 
                  name="Ring" 
                  variable="--ring" 
                  className="bg-[hsl(var(--ring))]" 
                  textClass="text-primary-foreground"
                />
              </div>
            </div>

            {/* Chart Colors */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Chart Colors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-grid-sm">
                {[1, 2, 3, 4, 5].map((num) => (
                  <ColorSwatch 
                    key={num}
                    name={`Chart ${num}`} 
                    variable={`--chart-${num}`} 
                    className={`bg-chart-${num}`} 
                    textClass="text-white"
                    small
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Gradients Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Gradients & Effects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-grid">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monochrome Gradient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-24 rounded-lg bg-gradient-to-r from-primary to-muted-foreground" />
                  <code className="text-xs text-muted-foreground mt-2 block">
                    from-primary to-muted-foreground
                  </code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inverse Gradient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-24 rounded-lg bg-gradient-to-r from-foreground to-muted" />
                  <code className="text-xs text-muted-foreground mt-2 block">
                    from-foreground to-muted
                  </code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Glass Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="glass-card rounded-lg p-4">
                    <p className="text-sm">Glass morphism effect</p>
                  </div>
                  <code className="text-xs text-muted-foreground mt-2 block">
                    className="glass-card"
                  </code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Glow Effect</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-primary glow-effect rounded-lg p-4">
                    <p className="text-sm text-primary-foreground">Glow shadow</p>
                  </div>
                  <code className="text-xs text-muted-foreground mt-2 block">
                    className="glow-effect"
                  </code>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Typography Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Typography</h2>
            <Card>
              <CardContent className="card-padding stack-md">
                <div className="stack-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Font Family</p>
                  <p className="text-lg">Geist, system-ui, sans-serif</p>
                </div>
                
                <div className="border-t pt-6 stack-md">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h1 className="text-3xl sm:text-5xl font-bold">Heading 1</h1>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-5xl font-bold</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h2 className="text-2xl sm:text-4xl font-bold">Heading 2</h2>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-4xl font-bold</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-xl sm:text-3xl font-semibold">Heading 3</h3>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-3xl font-semibold</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="text-lg sm:text-2xl font-semibold">Heading 4</h4>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-2xl font-semibold</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h5 className="text-base sm:text-xl font-medium">Heading 5</h5>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-xl font-medium</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="text-sm sm:text-base">Body Text</p>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-base</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground">Small / Muted Text</p>
                    <code className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">text-sm text-muted-foreground</code>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <p className="text-xs">Extra Small</p>
                    <code className="text-[10px] sm:text-xs text-muted-foreground">text-xs</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Spacing Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Spacing Utilities</h2>
            
            <div className="grid md:grid-cols-2 gap-grid">
              {/* Section Padding */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Section Padding</CardTitle>
                </CardHeader>
                <CardContent className="stack-sm">
                  <SpacingExample name="section-padding" value="py-16 md:py-24 lg:py-32" />
                  <SpacingExample name="section-padding-sm" value="py-10 md:py-14 lg:py-18" />
                  <SpacingExample name="section-padding-lg" value="py-20 md:py-32 lg:py-40" />
                </CardContent>
              </Card>

              {/* Container Padding */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Container & Card Padding</CardTitle>
                </CardHeader>
                <CardContent className="stack-sm">
                  <SpacingExample name="container-padding" value="px-4 md:px-6 lg:px-8" />
                  <SpacingExample name="card-padding" value="p-4 md:p-6 lg:p-8" />
                  <SpacingExample name="card-padding-sm" value="p-3 md:p-4 lg:p-5" />
                  <SpacingExample name="card-padding-lg" value="p-6 md:p-8 lg:p-10" />
                </CardContent>
              </Card>

              {/* Stack Utilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vertical Stack (space-y)</CardTitle>
                </CardHeader>
                <CardContent className="stack-sm">
                  <SpacingExample name="stack-sm" value="space-y-2 md:space-y-3" />
                  <SpacingExample name="stack-md" value="space-y-4 md:space-y-6" />
                  <SpacingExample name="stack-lg" value="space-y-6 md:space-y-8 lg:space-y-10" />
                  <SpacingExample name="stack-xl" value="space-y-8 md:space-y-12 lg:space-y-16" />
                </CardContent>
              </Card>

              {/* Inline Utilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inline & Gap Utilities</CardTitle>
                </CardHeader>
                <CardContent className="stack-sm">
                  <SpacingExample name="inline-sm" value="space-x-2 md:space-x-3" />
                  <SpacingExample name="inline-md" value="space-x-4 md:space-x-6" />
                  <SpacingExample name="gap-grid" value="gap-4 md:gap-6 lg:gap-8" />
                  <SpacingExample name="gap-grid-sm" value="gap-3 md:gap-4 lg:gap-5" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Buttons Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Buttons</h2>
            <Card>
              <CardContent className="card-padding">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="hero">Hero</Button>
                  <Button variant="glass">Glass</Button>
                  <Button variant="glow">Glow</Button>
                </div>
                <div className="flex flex-wrap gap-4 mt-6">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Badges Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Badges</h2>
            <Card>
              <CardContent className="card-padding">
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge className="bg-primary/10 text-primary border border-primary/20">Primary Soft</Badge>
                  <Badge className="bg-muted text-muted-foreground">Muted</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Animations Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Animations</h2>
            <div className="grid md:grid-cols-3 gap-grid">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Float</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <div className="w-16 h-16 bg-primary rounded-lg animate-float" />
                </CardContent>
                <div className="px-6 pb-4">
                  <code className="text-xs text-muted-foreground">animate-float</code>
                </div>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pulse Glow</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <div className="w-16 h-16 bg-muted-foreground rounded-lg animate-pulse-glow" />
                </CardContent>
                <div className="px-6 pb-4">
                  <code className="text-xs text-muted-foreground">animate-pulse-glow</code>
                </div>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gradient Shift</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-primary via-muted-foreground to-primary animate-gradient" />
                </CardContent>
                <div className="px-6 pb-4">
                  <code className="text-xs text-muted-foreground">animate-gradient</code>
                </div>
              </Card>
            </div>
          </section>

          {/* Skeletons Section */}
          <section className="stack-lg">
            <h2 className="text-2xl font-semibold">Skeleton Loaders</h2>
            <p className="text-muted-foreground">
              Skeleton components provide visual placeholders while content is loading. Use these to improve perceived performance and reduce layout shift.
            </p>
            
            {/* Base Skeleton */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Base Skeleton</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skeleton</CardTitle>
                </CardHeader>
                <CardContent className="stack-md">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <code className="text-xs text-muted-foreground block mt-4">
                    {`import { Skeleton } from "@/components/ui/skeleton";`}
                    <br />
                    {`<Skeleton className="h-4 w-full" />`}
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* Shimmer Skeleton */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Shimmer Skeleton</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ShimmerSkeleton</CardTitle>
                </CardHeader>
                <CardContent className="stack-md">
                  <div className="space-y-2">
                    <ShimmerSkeleton className="h-4 w-full" />
                    <ShimmerSkeleton className="h-4 w-3/4" />
                    <ShimmerSkeleton className="h-8 w-32" />
                  </div>
                  <code className="text-xs text-muted-foreground block mt-4">
                    {`import ShimmerSkeleton from "@/components/builder/configure/ShimmerSkeleton";`}
                    <br />
                    {`<ShimmerSkeleton className="h-4 w-full" />`}
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* Text & Avatar Skeletons */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Text & Avatar</h3>
              <div className="grid md:grid-cols-2 gap-grid">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonText</CardTitle>
                  </CardHeader>
                  <CardContent className="stack-md">
                    <SkeletonText lines={3} />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonText lines={3} />`}
                    </code>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonAvatar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <SkeletonAvatar size="sm" />
                      <SkeletonAvatar size="md" />
                      <SkeletonAvatar size="lg" />
                    </div>
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonAvatar size="sm" />`}
                      <br />
                      {`<SkeletonAvatar size="md" />`}
                      <br />
                      {`<SkeletonAvatar size="lg" />`}
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Card & Stats Skeletons */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Card & Stats</h3>
              <div className="grid md:grid-cols-2 gap-grid">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonCard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkeletonCard />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonCard />`}
                    </code>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonStats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkeletonStats />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonStats />`}
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Stats Grid</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SkeletonStatsGrid</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonStatsGrid count={4} />
                  <code className="text-xs text-muted-foreground block mt-4">
                    {`<SkeletonStatsGrid count={4} />`}
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* List Skeletons */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Lists</h3>
              <div className="grid md:grid-cols-2 gap-grid">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonListItem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkeletonListItem />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonListItem />`}
                    </code>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonList</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkeletonList items={3} />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonList items={3} />`}
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Table Skeletons */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Tables</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SkeletonTable</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonTable rows={3} columns={4} />
                  <code className="text-xs text-muted-foreground block mt-4">
                    {`<SkeletonTable rows={3} columns={4} />`}
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* Form Skeleton */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Forms</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SkeletonForm</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonForm fields={3} />
                  <code className="text-xs text-muted-foreground block mt-4">
                    {`<SkeletonForm fields={3} />`}
                  </code>
                </CardContent>
              </Card>
            </div>

            {/* Page Skeletons */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Page-Level</h3>
              <div className="grid md:grid-cols-2 gap-grid">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonPageHeader</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SkeletonPageHeader />
                    <code className="text-xs text-muted-foreground block mt-4">
                      {`<SkeletonPageHeader />`}
                    </code>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SkeletonPage</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Full page skeleton with header, stats grid, and table. Best used for dashboard loading states.</p>
                    <code className="text-xs block mt-4">
                      {`<SkeletonPage />`}
                    </code>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="stack-md">
              <h3 className="text-lg font-medium text-muted-foreground">Usage Guidelines</h3>
              <Card>
                <CardContent className="card-padding">
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Use <code className="text-xs bg-muted px-1 rounded">Skeleton</code> for simple rectangular placeholders</li>
                    <li>Use <code className="text-xs bg-muted px-1 rounded">ShimmerSkeleton</code> for animated shimmer effect on prominent loading areas</li>
                    <li>Match skeleton dimensions to actual content to prevent layout shift</li>
                    <li>Use content-specific skeletons (SkeletonCard, SkeletonTable, etc.) for consistent patterns</li>
                    <li>Import from <code className="text-xs bg-muted px-1 rounded">@/components/ui/skeleton</code> or <code className="text-xs bg-muted px-1 rounded">@/components/ui/content-skeleton</code></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Helper Components
const ColorSwatch = ({ 
  name, 
  variable, 
  className, 
  textClass,
  small = false 
}: { 
  name: string; 
  variable: string; 
  className: string; 
  textClass: string;
  small?: boolean;
}) => (
  <div className="stack-sm">
    <div className={`${small ? 'h-16' : 'h-24'} rounded-lg ${className} flex items-end p-3`}>
      <span className={`text-xs font-medium ${textClass}`}>{name}</span>
    </div>
    <code className="text-xs text-muted-foreground">{variable}</code>
  </div>
);

const SpacingExample = ({ name, value }: { name: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 gap-0.5 sm:gap-2">
    <code className="text-xs sm:text-sm font-medium text-primary">{name}</code>
    <code className="text-[10px] sm:text-xs text-muted-foreground break-all sm:break-normal">{value}</code>
  </div>
);

export default StyleGuide;
