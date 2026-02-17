# Accessibility
Allow your project to support all audiences.

---

## Overview

Manifest provides built-in accessibility features through its `reset.css` normalizer and base styles. These ensure your applications are accessible by default while maintaining flexibility for custom implementations.

All code snippets in these docs are intended to be semantically correct for screen readers and SEO crawlers.

---

## Built-in Features

- **Focus states** provide visible focus indicators for keyboard navigation.
- **Form elements** are accessible controls with proper labeling support.
- **Semantic HTML styles** preserve the semantic meaning of HTML elements.
- **Text scaling** uses font sizes and line heights optimized for readability.
- **Reduced motion** includes support for the `prefers-reduced-motion` media query.
- **ARIA styles** are provided for common ARIA attributes.

---

## Accessibility Checklist

While Manifest provides accessibility foundations, always test your applications. Here are some key areas to consider:

- [ ] Keyboard navigation (tab, enter, space, arrow keys)
- [ ] Focus indicators visible
- [ ] Color contrast ratios (WCAG 2.1 AA)
- [ ] Screen readers are usable (VoiceOver, NVDA, JAWS)
- [ ] Form controls have proper labels
- [ ] Text remains readable when zoomed to 200%
- [ ] Reduced motion preferences
- [ ] Heading hierarchy and document outline
- [ ] Interactive elements have sufficient touch targets
- [ ] Different input methods (mouse, keyboard, touch)