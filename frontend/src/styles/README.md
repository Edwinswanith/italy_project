# Tilde Mathematica Styles

This folder contains all the styling for the Tilde Mathematica application, separated from the component logic for better maintainability and organization.

## File Structure

```
styles/
├── tilde-mathematica.css    # Main CSS file with all component styles
└── README.md              # This documentation file
```

## CSS Architecture

The CSS is organized using a component-based approach with the following structure:

### 1. Main Container Styles
- `.tilde-container` - Main application container
- `.tilde-bg-effects` - Background visual effects
- `.tilde-content` - Content wrapper

### 2. Header Components
- `.tilde-header` - Main header container
- `.tilde-platform-badge` - Platform name badge
- `.tilde-title` - Main application title
- `.tilde-description` - Application description
- `.tilde-features` - Feature tags container
- `.tilde-feature-tag` - Individual feature tags

### 3. Live Snapshot Panel
- `.tilde-snapshot` - Snapshot panel container
- `.tilde-snapshot-grid` - Grid layout for snapshot items
- `.tilde-snapshot-item` - Individual snapshot items
- `.tilde-snapshot-label` - Item labels
- `.tilde-snapshot-value` - Item values
- `.tilde-snapshot-description` - Item descriptions

### 4. Navigation
- `.tilde-tab-nav` - Tab navigation container
- `.tilde-tab-container` - Tab button container
- `.tilde-tab-button` - Individual tab buttons
- `.tilde-tab-button.active` - Active tab state

### 5. Content Area
- `.tilde-content-area` - Main content container
- `.tilde-card` - Base card component
- `.tilde-card.elevated` - Elevated card variant
- `.tilde-card.glass` - Glass card variant

### 6. Form Components
- `.tilde-input` - Input fields
- `.tilde-slider` - Range sliders
- `.tilde-button` - Button components
- `.tilde-button.primary` - Primary button variant
- `.tilde-button.secondary` - Secondary button variant

### 7. Metric Cards
- `.tilde-metric-card` - Metric card container
- `.tilde-metric-card.default` - Default metric card
- `.tilde-metric-card.primary` - Primary metric card
- `.tilde-metric-card.secondary` - Secondary metric card

### 8. Utility Classes
- Text utilities (`.tilde-text-white`, `.tilde-text-center`, etc.)
- Spacing utilities (`.tilde-p-4`, `.tilde-m-4`, etc.)
- Layout utilities (`.tilde-flex`, `.tilde-grid`, etc.)
- Responsive utilities (`.md:tilde-grid-cols-2`, etc.)

## Usage

To use these styles in your components:

1. Import the CSS file:
```jsx
import '../styles/tilde-mathematica.css';
```

2. Use the CSS classes in your JSX:
```jsx
<div className="tilde-container">
  <header className="tilde-header">
    <span className="tilde-platform-badge">Tilde Platform</span>
    <h1 className="tilde-title">Tilde Mathematica Unified</h1>
  </header>
</div>
```

## Benefits of This Approach

1. **Separation of Concerns**: Styles are separated from component logic
2. **Maintainability**: Easier to update and modify styles
3. **Reusability**: CSS classes can be reused across components
4. **Performance**: CSS is cached by the browser
5. **Organization**: Clear structure makes it easy to find and modify styles
6. **Scalability**: Easy to add new styles without cluttering components

## Customization

To customize the styles:

1. Modify the CSS variables at the top of the file
2. Update the component-specific classes
3. Add new utility classes as needed
4. Use CSS custom properties for consistent theming

## Responsive Design

The styles include responsive breakpoints:
- Mobile: Default styles
- Tablet: `md:` prefix (768px+)
- Desktop: `lg:` prefix (1024px+)

## Browser Support

The CSS uses modern features like:
- CSS Grid
- Flexbox
- CSS Custom Properties
- Backdrop Filter
- CSS Gradients

Ensure your target browsers support these features or provide fallbacks.
