/**
 * Example-based prompts for teaching AI proper edit behavior
 */

export const EDIT_EXAMPLES = `
## Edit Strategy Examples

### Example 1: Update Header Color
USER: "Make the header background black"

CORRECT APPROACH:
1. Identify Header component location
2. Edit ONLY Header.jsx
3. Change background color class/style

INCORRECT APPROACH:
- Regenerating entire App.jsx
- Creating new Header.jsx from scratch
- Modifying unrelated files

EXPECTED OUTPUT:
<file path="src/components/Header.jsx">
// Only the Header component with updated background
// Preserving all existing functionality
</file>

### Example 2: Add New Page
USER: "Add a videos page"

CORRECT APPROACH:
1. Create Videos.jsx component
2. Update routing in App.jsx or Router component
3. Add navigation link if needed

INCORRECT APPROACH:
- Regenerating entire application
- Recreating all existing pages

EXPECTED OUTPUT:
<file path="src/components/Videos.jsx">
// New Videos component
</file>

<file path="src/App.jsx">
// ONLY the routing update, preserving everything else
</file>

### Example 3: Fix Styling Issue
USER: "Fix the button styling on mobile"

CORRECT APPROACH:
1. Identify which component has the button
2. Update only that component's Tailwind classes
3. Add responsive modifiers (sm:, md:, etc)

INCORRECT APPROACH:
- Regenerating all components
- Creating new CSS files
- Modifying global styles unnecessarily

### Example 4: Add Feature to Component
USER: "Add a search bar to the header"

CORRECT APPROACH:
1. Modify Header.jsx to add search functionality
2. Preserve all existing header content
3. Integrate search seamlessly

INCORRECT APPROACH:
- Creating Header.jsx from scratch
- Losing existing navigation/branding

### Example 5: Add New Component
USER: "Add a newsletter signup to the footer"

CORRECT APPROACH:
1. Create Newsletter.jsx component
2. UPDATE Footer.jsx to import Newsletter
3. Add <Newsletter /> in the appropriate place in Footer

EXPECTED OUTPUT:
<file path="src/components/Newsletter.jsx">
// New Newsletter component
</file>

<file path="src/components/Footer.jsx">
// Updated Footer with Newsletter import and usage
import Newsletter from './Newsletter';
// ... existing code ...
// Add <Newsletter /> in the render
</file>

### Example 6: Add External Library
USER: "Add animations with framer-motion to the hero"

CORRECT APPROACH:
1. Import framer-motion in Hero.jsx
2. Use motion components
3. System will auto-install framer-motion

EXPECTED OUTPUT:
<file path="src/components/Hero.jsx">
import { motion } from 'framer-motion';
// ... rest of Hero with motion animations
</file>

### Example 7: Remove Element
USER: "Remove start deploying button"

CORRECT APPROACH:
1. Search for "start deploying" in all component files
2. Find it in Hero.jsx
3. Edit ONLY Hero.jsx to remove that button

INCORRECT APPROACH:
- Creating a new file
- Editing multiple files
- Redesigning the entire Hero

EXPECTED OUTPUT:
<file path="src/components/Hero.jsx">
// Hero component with "start deploying" button removed
// All other content preserved
</file>

### Example 8: Delete Section
USER: "Delete the testimonials section"

CORRECT APPROACH:
1. Find which file contains testimonials
2. Remove only that section from the file
3. Keep all other content intact

INCORRECT APPROACH:
- Deleting the entire file
- Recreating the page without testimonials

### Example 9: Change a Single Style (CRITICAL EXAMPLE)
USER: "update the hero to bg blue"

CORRECT APPROACH:
1. Identify the Hero component file: 'src/components/Hero.jsx'.
2. Locate the outermost 'div' or container element.
3. Find the existing background color class (e.g., 'bg-gray-900').
4. Replace ONLY that class with 'bg-blue-500'.
5. Return the entire file, completely unchanged except for that single class modification.

**Original File Content (BEFORE):**
<file path="src/components/Hero.jsx">
import React from 'react';

export default function Hero() {
  return (
    <div className="w-full bg-gray-900 text-white py-20 px-4">
      <h1 className="text-5xl font-bold">Welcome to the App</h1>
      <p className="mt-4 text-lg">This is the original hero section.</p>
      <button className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
        Get Started
      </button>
    </div>
  );
}
</file>

**Expected Output (AFTER):**
<file path="src/components/Hero.jsx">
import React from 'react';

export default function Hero() {
  return (
    <div className="w-full bg-blue-500 text-white py-20 px-4">
      <h1 className="text-5xl font-bold">Welcome to the App</h1>
      <p className="mt-4 text-lg">This is the original hero section.</p>
      <button className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
        Get Started
      </button>
    </div>
  );
}
</file>

NOTICE: Everything remains EXACTLY the same except 'bg-gray-900' → 'bg-blue-500'. 
- The button still has bg-blue-600 (unchanged)
- All text, structure, imports are identical
- No reformatting, no "improvements", no cleanup

## Key Principles

1. **Minimal Changes**: Only modify what's necessary
2. **Preserve Functionality**: Keep all existing features
3. **Respect Structure**: Follow existing patterns
4. **Target Precision**: Edit specific files, not everything
5. **Context Awareness**: Use imports/exports to understand relationships

## File Identification Patterns

- "header" → src/components/Header.jsx
- "navigation" → src/components/Nav.jsx or Header.jsx
- "footer" → src/components/Footer.jsx
- "home page" → src/App.jsx or src/pages/Home.jsx
- "styling" → Component files (Tailwind) or index.css
- "routing" → App.jsx or Router component
- "layout" → Layout components or App.jsx

## Edit Intent Classification

UPDATE_COMPONENT: Modify existing component
- Keywords: update, change, modify, edit, fix
- Action: Edit single file

ADD_FEATURE: Add new functionality
- Keywords: add, create, implement, build
- Action: Create new files + minimal edits

FIX_ISSUE: Resolve problems
- Keywords: fix, resolve, debug, repair
- Action: Targeted fixes

UPDATE_STYLE: Change appearance
- Keywords: style, color, theme, design
- Action: Update Tailwind classes

REFACTOR: Improve code quality
- Keywords: refactor, clean, optimize
- Action: Restructure without changing behavior
`;

export function getEditExamplesPrompt(): string {
  return EDIT_EXAMPLES;
}

export function getComponentPatternPrompt(fileStructure: string): string {
  return `
## Current Project Structure

${fileStructure}

## Component Naming Patterns
Based on your file structure, here are the patterns to follow:

1. Component files are in: src/components/
2. Page components might be in: src/pages/ or src/components/
3. Utility functions are in: src/utils/ or src/lib/
4. Styles use Tailwind classes inline
5. Main app entry is: src/App.jsx

When the user mentions a component by name, look for:
- Exact matches first (Header → Header.jsx)
- Partial matches (nav → Navigation.jsx, NavBar.jsx)
- Semantic matches (top bar → Header.jsx)
`;
}