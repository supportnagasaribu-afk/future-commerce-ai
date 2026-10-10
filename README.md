# BarangViral AI Commerce

Design a premium, modern, futuristic UI/UX concept for:

BARANGVIRAL.STORE
AI E-COMMERCE MARKETPLACE

CORE PRODUCT CONCEPT:
AI → Intelligence → Discovery → Matching → Commerce

IMPORTANT:
This repository began as a UI/UX concept. The public marketplace and payment flows remain prototype interactions. The `/members` route is a Supabase-backed member area for authentication, member profiles, referrals, points history, support requests, and admin controls.

BRAND:
- Brand name: BarangViral.Store
- Positioning: AI E-Commerce Marketplace
- Primary visual identity: orange + white + black
- Style: premium, futuristic, intelligent commerce, clean and trustworthy
- Mobile-first and fully responsive
- Avoid excessive gradients, excessive animations, and visual clutter.
- The design must look like a serious global technology/e-commerce company, not a generic AI template.

HOMEPAGE STRUCTURE:

1. HEADER
- Official BarangViral.Store logo
- Navigation:
  Home
  Discover
  AI Shopping
  Viral Radar
  For Sellers
  For Partners
- CTA button: "Explore with AI"
- Mobile hamburger menu

2. HERO SECTION
Headline:
"AI-Powered Commerce. Smarter Decisions."

Subheadline:
"Discover products, identify opportunities, connect the right people, and turn intelligence into commerce."

Show the core flow visually:

AI
↓
INTELLIGENCE
↓
DISCOVERY
↓
MATCHING
↓
COMMERCE

Add a strong primary CTA:
"Explore AI Commerce"

Secondary CTA:
"See How It Works"

3. CORE FLOW SECTION
Create a premium five-step visual journey.

STEP 01 — AI
"Understand Intent"
AI understands what buyers, sellers, suppliers and partners need.

STEP 02 — INTELLIGENCE
"Turn Data Into Opportunity"
Transform commerce signals into useful intelligence.

STEP 03 — DISCOVERY
"Find What Matters"
Discover trending products, emerging opportunities and relevant products.

STEP 04 — MATCHING
"Connect the Right People"
Match buyers, sellers, suppliers and partners intelligently.

STEP 05 — COMMERCE
"Turn Opportunities Into Sales"
Convert better recommendations and connections into real commerce.

Use connecting lines/arrows between all five stages.

4. AI COMMERCE SECTION
Create a futuristic AI assistant interface mockup.

Example:
User:
"Find me the best products under RM100 for a small home."

AI:
- understands the request
- recommends products
- explains why
- compares options
- provides next actions

Make this look like a real future shopping experience.

5. VIRAL RADAR AI SECTION
Introduce:

"Viral Radar AI"

Subtitle:
"Discover products before the trend becomes obvious."

Show sample product intelligence cards:
- Viral Score
- Growth Score
- Competition
- Opportunity Score
- Demand
- AI Recommendation

Use realistic placeholder data only.
Clearly label it as concept/demo data.

6. FOR BUYERS
Show:
"Shop Smarter With AI"

Features:
- AI product recommendations
- Product comparison
- Personalized discovery
- Smart search
- AI shopping assistant

7. FOR SELLERS
Show:
"Sell Smarter With AI"

Features:
- AI product optimization
- Pricing intelligence
- Product analysis
- Marketing ideas
- Campaign assistance
- AI sales insights

8. FOR SUPPLIERS
Show:
"Find New Commerce Opportunities"

Features:
- Product opportunity discovery
- Market intelligence
- Seller matching
- Partner matching
- Demand signals

9. FOR VIRAL PARTNERS
Show:
"Know What To Promote"

Features:
- Trending product discovery
- Opportunity scoring
- AI content ideas
- Product recommendations
- Performance insights

10. AI COMMERCE FLYWHEEL
Create a visual diagram:

PRODUCT
↓
DATA
↓
AI INTELLIGENCE
↓
DISCOVERY
↓
MATCHING
↓
TRANSACTION
↓
MORE DATA
↓
SMARTER AI

Make this a major visual section.

11. TRUST / VISION SECTION
Headline:
"The Future of Commerce Is Intelligent."

Explain that BarangViral.Store is being built to connect people, products, data and opportunities through AI.

12. FINAL CTA
Headline:
"Welcome to the Next Generation of Commerce."

Buttons:
"Explore BarangViral"
"Join the Coming Marketplace"

13. FOOTER
BarangViral.Store
AI E-Commerce Marketplace

Links:
About
AI Commerce
For Buyers
For Sellers
For Suppliers
For Partners
Contact
Privacy
Terms

DESIGN SYSTEM:
- Primary color: vibrant BarangViral orange
- Supporting colors: black, white, subtle dark gray
- High contrast
- Rounded modern cards
- Premium typography
- Clean spacing
- Subtle glass/tech elements only where useful
- Use Lucide icons or equivalent modern icons
- Smooth but restrained animations
- Strong visual hierarchy
- Excellent mobile experience

IMPORTANT:
Do not invent a new logo.
Use the official BarangViral.Store logo provided by the owner.
Do not replace the brand identity.

Do not create fake statistics, fake users, fake sales numbers, or fake testimonials.

This is a UI/UX prototype for the future AI E-Commerce Marketplace.
Prioritize visual quality, information architecture, user experience and scalability.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/904d8f4a-79b0-4423-a2ad-7d611ea7eeea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Member area setup

Apply the migration in `supabase/migrations/` to the intended Supabase project, allow `https://barangviral.store/members` as an Auth redirect URL, and set the administrator user's Auth `app_metadata.role` to `admin`. The app uses only the Supabase URL and publishable key in the browser; never place a secret or service-role key in frontend configuration. The portal relies on the migration's row-level security policies.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
