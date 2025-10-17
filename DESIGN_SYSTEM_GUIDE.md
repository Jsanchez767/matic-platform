# MATIC PLATFORM - DESIGN SYSTEM GUIDE

## 🎨 Master CSS/Style System

This design system provides complete control over all colors, modals, and components across the entire application using CSS variables, Tailwind CSS, Radix UI, and shadcn/ui.

## 🎯 Key Features

- **✅ Complete Modal Fixes**: All dialogs, drawers, sheets, and popovers have proper backgrounds and text visibility
- **✅ Unified Color System**: All components use CSS variables for easy customization
- **✅ QR Scanner Integration**: Clean styling with qr-scanner (no more html5-qrcode conflicts)
- **✅ Dark Mode Support**: Automatic dark/light theme switching
- **✅ Consistent Design**: All components follow the same design tokens

## 🎨 Color Customization

### Primary Colors
Edit these variables in `src/app/globals.css` to change the main brand colors:

```css
:root {
  --primary: #3b82f6;           /* Main brand color (blue) */
  --primary-foreground: #ffffff; /* Text on primary color */
  --secondary: #f1f5f9;         /* Secondary backgrounds */
  --secondary-foreground: #475569; /* Text on secondary */
}
```

### Interactive Colors
```css
:root {
  --accent: #e2e8f0;            /* Hover states, subtle highlights */
  --accent-foreground: #1e293b;  /* Text on accent color */
  --destructive: #ef4444;        /* Error/delete actions (red) */
  --destructive-foreground: #ffffff;
  --success: #10b981;            /* Success states (green) */
  --success-foreground: #ffffff;
  --warning: #f59e0b;            /* Warning states (orange) */
  --warning-foreground: #ffffff;
}
```

### Modal & Overlay Colors
```css
:root {
  --overlay: rgba(0, 0, 0, 0.6);     /* Modal backdrop */
  --modal-background: #ffffff;        /* Modal content background */
  --modal-foreground: #0f172a;        /* Modal text color */
}
```

## 🌙 Dark Theme

Dark theme colors are automatically applied when `.dark` class is present:

```css
.dark {
  --background: #0f172a;         /* Dark page background */
  --foreground: #f8fafc;         /* Dark page text */
  --modal-background: #1e293b;   /* Dark modal background */
  --modal-foreground: #f8fafc;   /* Dark modal text */
  /* ... more dark colors */
}
```

## 🧩 Component Styling

### Buttons
Use Tailwind utilities that reference our CSS variables:
```tsx
<Button className="bg-primary text-primary-foreground">Primary</Button>
<Button className="bg-destructive text-destructive-foreground">Delete</Button>
<Button className="bg-success text-success-foreground">Save</Button>
```

### Cards
```tsx
<Card className="bg-card text-card-foreground border-border">
  <CardContent className="text-muted-foreground">
    Content text
  </CardContent>
</Card>
```

### Modals/Dialogs
All modals automatically use the correct colors:
```tsx
<Dialog>
  <DialogContent className="scan-lookup-modal"> {/* Optional: specific modal styling */}
    <DialogTitle>Modal Title</DialogTitle>
    <DialogDescription>Modal description</DialogDescription>
  </DialogContent>
</Dialog>
```

## 🛠️ Quick Customization Examples

### Change Primary Brand Color to Purple
```css
:root {
  --primary: #8b5cf6;           /* Purple */
  --ring: #8b5cf6;              /* Focus rings */
}
```

### Change Success Color to Custom Green
```css
:root {
  --success: #059669;           /* Emerald green */
  --success-foreground: #ffffff;
}
```

### Customize Modal Appearance
```css
:root {
  --overlay: rgba(0, 0, 0, 0.8);        /* Darker backdrop */
  --modal-background: #f8fafc;          /* Light gray background */
  --radius: 0.75rem;                    /* More rounded corners */
}
```

### Dark Theme Modal Colors
```css
.dark {
  --overlay: rgba(0, 0, 0, 0.9);        /* Almost black backdrop */
  --modal-background: #111827;          /* Very dark modal */
}
```

## 🎯 Fixed Issues

### ✅ Scanner Modal Transparency
- Added `.scan-lookup-modal` class with proper background
- All gray text colors now use theme variables
- Modal overlays have proper opacity

### ✅ QR Scanner Clean Implementation
- Replaced html5-qrcode with qr-scanner
- No more CSS conflicts or aggressive overrides
- Clean video element with proper styling

### ✅ Drawer/Sheet Background Issues
- Fixed Vaul drawer backgrounds using `[data-vaul-drawer]` selectors
- Proper backdrop blur and opacity
- All text colors inherit correctly

## 📱 Responsive Design

All components automatically adapt to mobile screens with proper spacing and sizing.

## 🔧 Utility Classes

Use these classes throughout the application:

### Text Colors
- `.text-primary` - Brand color text
- `.text-muted` - Subtle text
- `.text-destructive` - Error text
- `.text-success` - Success text
- `.text-warning` - Warning text

### Background Colors
- `.bg-primary` - Brand background
- `.bg-muted` - Subtle background
- `.bg-card` - Card background
- `.bg-destructive` - Error background
- `.bg-success` - Success background

### Border Colors
- `.border-primary` - Brand borders
- `.border-muted` - Subtle borders
- `.border-destructive` - Error borders

## 🚀 Getting Started

1. **Edit Colors**: Modify CSS variables in `src/app/globals.css`
2. **Use Components**: Import from `@/ui-components/`
3. **Apply Classes**: Use Tailwind utilities that reference variables
4. **Test Themes**: Toggle dark mode to see both themes
5. **Check Modals**: Open any dialog/drawer to see proper styling

## 📝 Example: Creating a Custom Button

```tsx
// Using utility classes
<Button className="bg-warning text-warning-foreground hover:bg-warning/90">
  Custom Warning Button
</Button>

// Or create a custom variant in the Button component
// and use CSS variables for consistency
```

All colors, modals, and components now work consistently across the entire application! 🎉