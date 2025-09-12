# Home Page Components Rules

When working with home/landing page components in components-new/app/(home):

## Structure
```
home/
├── sections/         # Major page sections
│   ├── hero/        # Hero section with flames
│   ├── features/    # Feature showcase
│   ├── testimonials/# Customer testimonials
│   ├── pricing/     # Pricing cards
│   └── faq/         # FAQ section
├── navbar/          # Landing page navbar
└── footer/          # Landing page footer
```

## Migration Notes
These components will be migrated from `marketing/` when beginning home page migration after Dashboard v2.

### Priority Sections to Migrate:
1. **Hero** - Main landing with HeroFlame effect
2. **Features** - Feature grid with animations
3. **Testimonials** - Social proof section
4. **Pricing** - Pricing tiers with heat buttons
5. **FAQ** - Collapsible FAQ items

### Usage Pattern:
```tsx
// app/page.tsx (future)
import { Hero } from '@/components/home/sections/hero';
import { Features } from '@/components/home/sections/features';
import { Testimonials } from '@/components/home/sections/testimonials';
import { Pricing } from '@/components/home/sections/pricing';
import { FAQ } from '@/components/home/sections/faq';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
    </>
  );
}
```

## Design Principles
- **Fire theme**: Subtle flame effects in hero
- **Performance**: Lazy load below-fold sections
- **Responsive**: Mobile-first approach
- **Animations**: Intersection observer for scroll effects