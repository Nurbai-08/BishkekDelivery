# Bishkek Delivery: design decisions

UI/UX Pro Max was installed from nextlevelbuilder/ui-ux-pro-max-skill and applied before UI implementation. Its food-delivery design-system and React form searches informed this system. Raw recommendations are in `design-system/bishkek-delivery/MASTER.md`.

Project-specific decisions override generic recommendations: this is an ordering catalog, so use a compact editorial hero and immediately accessible restaurant feed, not a marketing landing page. Follow the specification's sans-serif typography rather than the suggested serif pairing.

- Warm off-white canvas, white surfaces, terracotta primary, ink typography, sage success.
- Manrope variable, self-hosted through Fontsource, including Cyrillic. Base 16px, headings balanced.
- All colors are semantic CSS tokens. Dark text on light terracotta accents; white text only on the darker primary.
- Desktop: bounded 1240px content, generous gutters, three restaurant columns. Mobile: one column, five navigation items and a separate cart CTA.
- Real cuisine photography from Pexels with source metadata. Seed restaurants are fictional and visibly marked. Product photography uses a neutral placeholder until the restaurant uploads the actual dish; do not mislabel a generic photo as a specific meal.
- Keyboard focus, 44px controls, native labels, reduced motion, reserved image ratios, loading/error/empty states.
- Checkout is split into address and review. The final amount comes from the backend; price changes require a new review.
- Status tracking uses actual history. Future milestones are never shown as completed.
