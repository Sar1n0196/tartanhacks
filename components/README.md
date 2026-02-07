# Components

This directory contains React components for the Onboarding Intelligence Agent | Agilow.

## Directory Structure

- `shared/` - Reusable components used across the application
- `builder/` - Components for the founder context building flow
- `onboard/` - Components for the engineer onboarding chat interface

## Shared Components

### ConfidenceScore

Displays a confidence badge with color-coded styling based on the confidence value.

**Requirements:** 7.6, 8.7

**Usage:**
```tsx
import ConfidenceScore from '@/components/shared/ConfidenceScore';

<ConfidenceScore 
  confidence={{ value: 0.9, reason: 'Strong evidence' }}
  showReason={true}
/>
```

**Props:**
- `confidence: ConfidenceScore` - The confidence score object with value (0-1) and optional reason
- `showReason?: boolean` - Whether to display the reason text (default: false)

**Color Scheme:**
- High confidence (≥0.7): Green
- Medium confidence (0.5-0.7): Yellow
- Low confidence (<0.5): Orange/Red

### DemoModeToggle

Provides a toggle switch for enabling/disabling demo mode.

**Requirements:** 7.6, 8.7

**Usage:**
```tsx
'use client';

import { useState } from 'react';
import DemoModeToggle from '@/components/shared/DemoModeToggle';

function MyComponent() {
  const [demoMode, setDemoMode] = useState(false);
  
  return (
    <DemoModeToggle 
      enabled={demoMode}
      onChange={setDemoMode}
      className="my-4"
    />
  );
}
```

**Props:**
- `enabled: boolean` - Current demo mode state
- `onChange: (enabled: boolean) => void` - Callback when toggle changes
- `className?: string` - Optional additional CSS classes

**Note:** This is a client component and must be used within a 'use client' context.

## Onboard Components

### CitationBadge

Displays a citation with appropriate styling based on the citation type.

**Requirements:** 6.3, 7.4, 7.5

**Usage:**
```tsx
import CitationBadge from '@/components/onboard/CitationBadge';

// URL citation (clickable link)
<CitationBadge 
  citation={{ 
    type: 'url', 
    reference: 'https://example.com/about',
    text: 'About page'
  }}
  index={1}
/>

// Interview citation
<CitationBadge 
  citation={{ 
    type: 'interview', 
    reference: 'business-model'
  }}
/>

// Section citation
<CitationBadge 
  citation={{ 
    type: 'section', 
    reference: 'Vision'
  }}
/>
```

**Props:**
- `citation: Citation` - The citation object with type, reference, and optional text
- `index?: number` - Optional index number to display (e.g., [1], [2])

**Citation Types:**
- `url` - Displays as a clickable link with external link icon (blue styling)
- `interview` - Displays the interview category with chat icon (purple styling)
- `section` - Displays the section reference with document icon (gray styling)

## Example: Using Components Together

```tsx
'use client';

import { useState } from 'react';
import ConfidenceScore from '@/components/shared/ConfidenceScore';
import DemoModeToggle from '@/components/shared/DemoModeToggle';
import CitationBadge from '@/components/onboard/CitationBadge';

export default function ExamplePage() {
  const [demoMode, setDemoMode] = useState(false);
  
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Context Pack</h1>
        <DemoModeToggle enabled={demoMode} onChange={setDemoMode} />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Company Vision</h2>
          <ConfidenceScore 
            confidence={{ value: 0.85, reason: 'From founder interview' }}
          />
        </div>
        
        <p className="text-gray-700">
          To revolutionize how engineers understand business context...
        </p>
        
        <div className="flex flex-wrap gap-2">
          <CitationBadge 
            citation={{ 
              type: 'url', 
              reference: 'https://company.com/about' 
            }}
            index={1}
          />
          <CitationBadge 
            citation={{ 
              type: 'interview', 
              reference: 'vision' 
            }}
            index={2}
          />
        </div>
      </div>
    </div>
  );
}
```

## Testing

All components include comprehensive unit tests. Run tests with:

```bash
npm test
```

To run tests for specific components:

```bash
npm test -- components/shared/ConfidenceScore.test.tsx
npm test -- components/shared/DemoModeToggle.test.tsx
npm test -- components/onboard/CitationBadge.test.tsx
```

## Styling

All components use Tailwind CSS for styling with a consistent design system:

- **Colors:** Blue (primary), Green (success/high confidence), Yellow (warning/medium confidence), Orange (low confidence), Purple (interview), Gray (neutral)
- **Spacing:** Consistent padding and margins using Tailwind's spacing scale
- **Typography:** Clear hierarchy with appropriate font sizes and weights
- **Interactivity:** Hover states and transitions for better UX

## Accessibility

Components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast
