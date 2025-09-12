# Flame Effects Rules

When working with visual effects components in components-new/shared/effects:

## Flame ASCII System

The flame effects are data-driven ASCII animations that create subtle, fire-inspired backgrounds.

### How It Works
1. **data.json Files**: Each flame component has an accompanying `data.json` file containing ASCII art frames
2. **Frame Animation**: Components cycle through frames at specified intervals (40-85ms)
3. **Visibility-Based**: Uses `setIntervalOnVisible` to only animate when in viewport
4. **innerHTML Rendering**: ASCII frames are inserted as HTML to preserve formatting

### Available Flames

#### CoreFlame
- Frame Speed: 80ms
- Size: 1110px × 470px
- Color: `text-black-alpha-20`
- Usage: Background texture for sections

#### AsciiExplosion
- Frame Speed: 40ms (faster)
- Initial Delay: 30 frames (1.2s)
- Color: `text-[#FA5D19]` (heat orange)
- Usage: Dramatic accent for CTAs or empty states

#### HeroFlame
- Frame Speed: 85ms
- Features: Mirrored flames on both sides
- Usage: Hero sections with dual flames

#### FlameBackground (Wrapper)
- Intensity based on metrics (0-100)
- Dynamic color (black → orange)
- Speed increases with intensity
- Optional pulse animation

### Usage Examples
```tsx
import { CoreFlame } from '@/components/shared/effects/flame';
import { FlameBackground } from '@/components/shared/effects/flame';

// Static flame
<div className="relative">
  <CoreFlame />
  <YourContent />
</div>

// Dynamic intensity flame
<FlameBackground intensity={cpuUsage} animate={cpuUsage > 80}>
  <DashboardCard />
</FlameBackground>
```

### Performance Considerations
- **Viewport Detection**: Only animates when visible
- **GPU Acceleration**: Use `transform` for positioning
- **Frame Caching**: Frames are pre-loaded from JSON
- **Cleanup**: Intervals cleared on unmount

### Design Guidelines
- **Subtlety**: Keep opacity low (10-30%) for backgrounds
- **Context**: Use sparingly, match intensity to data
- **Accessibility**: Ensure contrast ratios maintained
- **Mobile**: Consider reducing/disabling on mobile for performance

### Custom Utility Classes
- `cw-*`: Custom width (e.g., `cw-720` = 720px)
- `ch-*`: Custom height (e.g., `ch-470` = 470px)
- `font-ascii`: Monospace font for ASCII art
- Colors from heat scale: `text-heat-*`, `text-black-alpha-*`