# Portfolio design and navigation

Preserve the existing visual language when extending this portfolio:

- Purple page background (`--color-background`), lavender surfaces (`--color-panel`), deep purple text, and lighter lavender hover states. Reuse the CSS color tokens.
- Glacial Indifference typography with regular weights and lightly spaced lettering.
- Rounded, borderless tiles; spacious asymmetric primary menu; smaller companion tiles for personal growth chapters, separated by whitespace and aligned to the same full width.
- Consistent outline SVG icons using a 24×24 viewBox, 1.7 stroke width, and rounded caps and joins. Icons beside labels are decorative.
- Soft reveal and hover transitions using the existing easing. Respect reduced motion and retain visible keyboard focus.
- Let cards follow their content height. Loading reveals, retry states, SPA navigation, school changes and organization disclosures use a shared 420ms measured-height transition alongside existing fades. Outgoing skeletons leave normal flow at the start of the crossfade, avoiding a second jump when removed. Rebase interrupted transitions from their current height, release all size constraints on completion, and settle immediately on resize or reduced motion. Keep text unscaled during resizing.
- Soft surface shadows and up to 3.5 degrees of mouse-following tilt add depth to menu tiles and the portrait; hovered tiles lift by 5px. Keep surfaces lavender, preserve the compact secondary menu, and disable tilt for touch and reduced motion. Avoid continuous floating or spinning effects.
- Render each menu tile as a single flat surface within its tilt transform. Avoid separate Z layers for labels/icons and hard or inset shadow edges, which can produce visible seams and streaks.
- Responsive grids that wrap labels and reflow without horizontal scrolling.

This is a vanilla HTML/CSS/JavaScript SPA. Both menu groups live inside `.menu`. Chapter buttons use `data-page` and `.console__label` so the existing script can register destinations, update the shared chapter view and document title, restore focus, and support browser Back/Forward without a reload or URL change. Keep the introduction and the shared chapter navigation consistent when adding content. About Me, Educational Background, Achievements & Milestones, Vision & Mission, Values & Principles, and Strengths & Weaknesses load their content from local JSON; other chapters currently contain their title only.

## Educational Background content

Edit `config/education.content.json`. `institutions` is displayed in the order provided; duplicate or remove entries to change the list. Each entry contains `institution`, `level`, `period`, `program`, `description`, `logo`, `logoAlt`, and `organizations`. Every organization contains a `name` and a `positions` array, which supports multiple roles. Use an empty organizations array to omit the involvement section, or an empty institutions array to show the empty state.

Replace placeholder institution details as needed. Replace `logo` with a local asset path and update `logoAlt` when adding a real institution logo. Images retain their original proportions within a rounded stamp frame, filling its available space with `object-fit: contain` and no added image padding. The frame is 88px on desktop, 76px on smaller screens, and 68px on narrow phones; the metadata, institution name, and program form one text block beside it. Keep its slight offset outline and single corner spark close to the frame, with the logo centered beside the metadata and institution name. Missing or failed logos show a text fallback. Keep logo backgrounds neutral so real brand colors stay intact.

Education uses a school timeline beside one inline detail panel. Desktop selectors show the stage, institution and dates; on small screens they become compact tabs above the detail panel, with the full dates in the panel. The first school is selected initially. Selecting another school updates the panel in place without changing the page or opening an overlay. Keep the logo, institution, program and personal description together.

Organization roles are a native inline disclosure, collapsed initially and labeled “Organizations / Clubs / Societies”. Build long organization lists only when opened. Visited school panels retain their disclosure state. The school selectors use tab semantics, roving focus, arrow keys appropriate to the orientation, and Home/End. The panel stays next in the keyboard order.

Retain the same lavender surfaces, regular typography, organic frames, decorative doodles, shimmer, and crossfade timing as About Me. School changes and organization reveals use short fades, disabled under reduced motion. The JSON loader validates content, caches successful loads, offers retry on failure, and settles animations when navigating away or enabling reduced motion. Loading status is available to screen readers without visible loading copy.

## Achievements & Milestones content

Edit `config/achievements.content.json`. The `achievements` array controls the order of entries. Each entry requires `title`, `category`, `institution`, `level`, and `year` as strings. Leave `level` or `year` empty when not applicable or not yet supplied; those labels are hidden. An optional `description` adds a personal reflection; leave it empty to omit it. Use `icon` values `medal`, `trophy`, `flag`, or `sparkles`, and `color` values `gold`, `mint`, `rose`, or `lavender`. Unknown or omitted presets fall back to a gold card with a medal. An empty achievements array shows the empty state.

Achievements form one lavender honors list with equally sized headings and subtle row separators. Each desktop row places a small organic icon badge on the left, the category/year and achievement in the middle, and the issuing institution on the right. On smaller screens, the institution moves beneath the title. Reserve muted champagne, sage and mauve accents for the icon badges and category labels; keep the overall surface lavender with deep purple text. Preserve regular typography, rounded corners and soft shadows. Avoid oversized featured entries, contrasting footer bands, tilted year stickers or scattered decorative sparks.

Achievements use the same JSON validation, cached loading, screen-reader loading status, error/retry, cancellable skeleton crossfade and reduced-motion behavior as the other completed chapters.

## Vision & Mission content

Edit `config/vision.content.json` and `config/mission.content.json` independently. Both require `heading`, `eyebrow`, `statement`, `detail` as strings. Heading, eyebrow and statement must contain text; an empty detail is hidden. The optional `example` boolean may be retained as content metadata; it does not add a visible badge. Both panels show paragraph content only; do not add focus themes or commitment lists.

Use two compact stacked cards: lavender for vision and soft peach for mission. Each card has a slim header with its outline icon and title on the left and eyebrow on the right, separated from the text by a subtle rule. The statement and supporting paragraph flow beneath across the available width. The header wraps naturally on mobile. Each card takes only the height its content needs. Avoid equal-height side-by-side cards and large empty areas. Preserve regular typography, restrained heading sizes, generous text spacing, rounded corners and bare outline header icons. Do not add badges, chips or decorative charts; let the panel colors carry the visual contrast.

Panels arrive with a soft stagger and skeletons crossfade into copy. Keep motion brief and finite; do not add continuous floating or spinning. Reduced motion shows the final static state. Each panel has independent validation, loading, caching and retry; a failure in one must leave the other readable. Navigation and motion preference changes cancel reveals safely without hiding loaded content or changing another chapter’s title.

## Values and self-reflection content

Edit `config/values.content.json` for Values & Principles. `title` changes the page heading, `statement` is the opening line, and `introduction` is its supporting paragraph. The `items` array contains objects with `title` and `description`; add, remove or reorder them freely. The initial four principles connect dignity, integrity, shared opportunity and purposeful growth to the vision and mission. They describe aspirations, not biographical claims. Present them in one compact lavender panel with two columns that become one on mobile; keep numbering understated and avoid badges.

Edit `config/strengths.content.json` for Strengths & Weaknesses. It shares `title`, `statement` and `introduction`. The `strengths` and `weaknesses` objects each contain an editable `heading` and an `items` array of `title`/`description` objects. All initial entries are explicitly placeholder prompts. Replace the introductory placeholder sentence when adding personal reflections. Use sage and peach panels side by side, stacked on mobile, with quiet separators and regular typography. Empty arrays show a short empty state.

Both chapters use text-only DOM rendering, JSON validation, independent caches, retry controls, accessible loading announcements, cancellable crossfades and the shared fluid height transitions. Content changes take effect on reload; no HTML or JavaScript editing is needed.
