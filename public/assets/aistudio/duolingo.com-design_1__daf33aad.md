---
version: alpha
name: Duolingo Bright
description: A playful, high-contrast learning system centered on vivid green, generous whitespace, and friendly rounded UI.
colors:
  primary: "#58CC02"
  secondary: "#3C3C3C"
  tertiary: "#1CB0F6"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#3C3C3C"
  border: "#E5E7EB"
  muted: "#AFAFAF"
  success: "#58CC02"
  error: "#FF4B4B"
typography:
  headline-display:
    fontFamily: feather
    fontSize: 64px
    fontWeight: 700
    lineHeight: 77px
    letterSpacing: -1.28px
  headline-lg:
    fontFamily: feather
    fontSize: 48px
    fontWeight: 700
    lineHeight: 58px
    letterSpacing: 0px
  headline-md:
    fontFamily: sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  headline-sm:
    fontFamily: sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: duolingo-sans
    fontSize: 17px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: duolingo-sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: duolingo-sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  label-lg:
    fontFamily: sans-serif
    fontSize: 15px
    fontWeight: 700
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 17px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 10px
  sm: 14px
  md: 40px
  lg: 50px
  xl: 64px
  gutter: 16px
  section: 80px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: 18px 16px
    width: 330px
    height: 50px
  button-primary-hover:
    backgroundColor: "#46B700"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: 18px 16px
    width: 330px
    height: 50px
  button-secondary-border:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 14px 16px
---

# Duolingo Bright

## Overview
Duolingo’s visual language is playful, approachable, and instantly recognizable, with a cheerful learning-first personality rather than a formal corporate tone. The interface relies on large open whitespace, bold mascot-driven illustrations, and compact UI chrome so the brand feels energetic without becoming cluttered. The overall impression is friendly and motivating, aimed at broad consumer audiences and learners of all ages.

## Colors
- **Primary (#58CC02):** The signature Duolingo green used for the brand mark, primary call-to-action buttons, success states, and high-energy accent moments. It feels optimistic, playful, and immediately on-brand.
- **Secondary (#3C3C3C):** A deep charcoal used for body text, headings, and neutral interactive text. It provides strong readability while feeling softer than pure black.
- **Tertiary (#1CB0F6):** A bright blue accent for supporting emphasis and secondary informational moments. It adds variety without competing with the primary green.
- **Neutral (#FFFFFF):** The main canvas color. White space is a core part of the system and gives the illustrations and controls room to breathe.
- **Surface (#FFFFFF):** Card and panel backgrounds stay clean and bright, keeping the interface lightweight and unobtrusive.
- **On-surface (#3C3C3C):** Default readable text on white surfaces. This is the main neutral copy color across the system.
- **Border (#E5E7EB):** A subtle light gray for dividers, card edges, and low-emphasis outlines.
- **Muted (#AFAFAF):** Used for lighter utility text such as language selectors and secondary metadata.
- **Success (#58CC02):** Reinforces progress, completion, and positive feedback with the same vivid green as the primary brand color.
- **Error (#FF4B4B):** A clear alert color for validation and failure states, reserved for rare emphasis.

## Typography
The system uses three distinct typographic voices: a custom feather-like display face for large headlines, a neutral sans-serif for smaller headings and UI labels, and Duolingo Sans for paragraph text. Headlines are bold, compact, and friendly, with the largest display style using tight negative letter spacing to feel energetic and branded. Body text is sized for legibility and warmth, while labels and button text are upper-confidence and heavier weight to support quick scanning.

The strongest headings are brand-forward and often appear short and declarative. Supporting text stays calm and readable, with no obvious uppercase convention in body copy. Labels and controls lean toward semi-bold or bold weights, and some utility text appears slightly tracked for crispness.

## Layout
The homepage composition is spacious and centered, with the main hero content arranged in a simple two-column structure: illustration on the left, messaging and actions on the right. The design favors a fluid layout with generous whitespace rather than dense grids, and the page breathing room is a defining part of the brand feel. Vertical spacing is large and deliberate, with section and cluster spacing in the 40px–64px range and smaller UI gaps around 10px–14px for compact controls.

Primary actions are stacked vertically and centered within their content column, giving the page a clear reading and interaction order. Cards and controls use modest internal padding, while full-width page edges remain mostly untouched to preserve the airy canvas. Navigation elements along the bottom feel like a docked rail with consistent spacing between language items.

## Elevation & Depth
Depth is subtle and mostly achieved through contrast, borders, and gentle shadow rather than dramatic layering. The primary button uses a distinct down-shadow effect to mimic a tactile, lifted surface, while cards remain nearly flat with a light border. White surfaces dominate, so hierarchy comes from color, weight, and spacing more than from strong elevation changes.

The system avoids heavy drop shadows on most containers. This keeps the UI clean and illustration-forward while letting the mascot artwork and green button accents do the visual lifting.

## Shapes
The shape language is friendly and rounded, but not fully pill-based. Buttons use a more pronounced 12px radius for the primary action and a slightly tighter 4px radius for the secondary outline treatment. Cards sit in the middle with an 8px radius, reinforcing a soft but structured feel.

Overall, the system feels approachable and playful rather than sleek or sharp. Rounded corners are used to reduce formality and support the cartoon-like personality of the brand.

## Components
**Buttons**
- Use `button-primary` for the main CTA. It should be bright green, high-contrast white text, bold label styling, and a prominent 12px radius. The visual weight should come from both color and the subtle shadow.
- Use `button-secondary` for alternate actions such as login or existing-account paths. It should remain white/transparent with a thin neutral border and dark text.
- Use `button-link` only for low-emphasis text actions and utility navigation. Keep it minimal, unboxed, and underlined where needed.
- Primary buttons should maintain a strong minimum width and comfortable vertical padding so they feel substantial and tap-friendly.

**Cards**
- Cards should use the `card` treatment: white background, light gray border, 8px radius, and modest 16px padding.
- Keep cards quiet and functional; they should support content rather than compete with brand accents.
- Avoid heavy shadows or tinted card backgrounds.

**Inputs**
- Inputs should follow the same soft, minimal border language as secondary controls.
- Use white surfaces, dark text, and a modest radius to keep forms consistent with the rest of the system.
- Focus states should be clear and accessible, but not visually noisy.

**Navigation and selectors**
- Utility selectors such as language switching should use muted text and restrained iconography.
- Bottom navigation items can use compact labels with strong spacing consistency and minimal ornamentation.
- Icons and mascots are allowed to be colorful and expressive, but the surrounding UI should stay calm.

## Do's and Don'ts
- Do keep the interface spacious and let white space do much of the visual work.
- Do use the primary green for the most important action on the page.
- Do pair bold, friendly headlines with simpler neutral supporting text.
- Do keep cards and containers mostly flat, with only subtle borders or shadows.
- Don't introduce dark, heavy surfaces that fight the playful mood.
- Don't overuse rounded pills everywhere; keep radius varied by component purpose.
- Don't make secondary actions visually louder than the primary CTA.
- Don't crowd the layout with too many competing colors or dense UI clusters.