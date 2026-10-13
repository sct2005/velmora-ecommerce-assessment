# Velmora — GIS Analytics Practical Assessment

## 1. Your role

Act as a senior frontend developer, luxury fashion e-commerce designer, data analyst, and AI product engineer.

Your task is to deliver a credible, polished and functional e-commerce concept for Velmora, a fictional London evening-wear label, as part of the GIS Analytics practical assessment.

Make commercially sensible decisions, write maintainable code, verify your findings, and explain important trade-offs.

Do not behave as though the objective is simply to produce a visually impressive mock-up. The finished work must demonstrate technical execution, commercial judgement, useful AI functionality and an ability to explain your decisions.

## 2. The assessment requirements

The following deliverables are mandatory:

1. A homepage designed for Velmora's brand and audience.
2. One complete product page.
3. A working mobile-friendly website.
4. One AI feature that genuinely helps a customer make a purchasing decision.
5. An AI feature that acknowledges uncertainty and never invents products, prices or dates.
6. A one-page commercial plan containing three changes most likely to increase sales before Black Friday, based on the supplied analytics.
7. Deployment to a free hosting provider.
8. A repository link and live website link.
9. Preparation for a 10-minute presentation covering the website, decisions, commercial impact and what could be cut.

The assessment has a four-hour working limit. Prioritise a complete, working submission over optional extensions.

## 3. Source files and factual accuracy

Inspect all supplied materials before implementing the website.

Expected source files:
- `brand.md`
- `products.json`
- `analytics.csv`
- The GIS Analytics assessment PDF

The filenames may differ. Locate the actual files rather than assuming they exist at specific paths.

### Source-of-truth rules

`brand.md` is authoritative for:
- Brand identity and positioning
- Target audience
- Brand voice
- Colour palette
- Typeface choices

`products.json` is authoritative for:
- Product names and identifiers
- Prices
- Fabrics
- Sizes
- Occasions
- Lead times
- Other supplied product attributes

`analytics.csv` is authoritative for:
- Traffic and channel performance
- Device performance
- Funnel events
- Orders and revenue
- Advertising spend

The assessment PDF is authoritative for the required deliverables and constraints.

Do not invent client facts, product details, sales figures, customer reviews, testimonials, delivery promises, stock availability or commercial outcomes.

If information is missing, either omit it, clearly label it as illustrative, or explain the uncertainty.

Do not silently change the supplied brand guidelines. If a design decision conflicts with them, follow the source and explain the trade-off.

Preserve the original source data. Do not overwrite or modify the original supplied files.

## 4. Time management and prioritisation

Work to a four-hour budget, including analysis, implementation, testing and deployment.

Use this as a planning guide:

- 0–25 minutes: inspect the brief, brand, products and analytics.
- 25–45 minutes: decide the design direction, technology stack and implementation plan.
- 45–115 minutes: build the homepage and product page.
- 115–155 minutes: implement the AI shopping feature.
- 155–190 minutes: analyse the data, complete the commercial plan and test the website.
- 190–220 minutes: deploy, verify links and prepare the presentation.

These are approximate limits, not a reason to skip essential work. If a stage takes longer than expected, reduce optional features rather than sacrificing a working website or evidence-based analysis.

At the beginning:
1. Inspect the repository and available files.
2. Identify any existing project setup.
3. Summarise the brand and product catalogue.
4. Identify the columns, date range and data quality issues in the analytics.
5. Propose the simplest implementation plan.
6. Identify risks that could prevent delivery.

Do not spend excessive time planning. Once the essential facts are understood, begin implementation.

## 5. Technology and architecture

Prefer the simplest maintainable stack that supports the requirements.

If the project is empty, consider:
- React
- Vite
- TypeScript where practical
- Plain CSS, CSS modules or an existing lightweight styling solution
- A free static hosting platform such as Vercel, Netlify, GitHub Pages or Cloudflare Pages

Choose one stack and explain why. Do not install unnecessary frameworks or dependencies.

Before adding a dependency, ask:
- Is it necessary for a required feature?
- Can the task be completed more simply?
- Will it complicate deployment?
- Is there enough time to test it?

If a project already exists, inspect it before replacing its configuration or changing frameworks.

Keep the application modular, with sensible components for the header, homepage sections, product details, recommendation interface and footer.

Keep product data separate from presentation code wherever practical.

Do not add authentication, a database, a checkout backend, payment processing or complex infrastructure unless genuinely required.

Do not pretend that a demo checkout processes real payments or that the site has live inventory if those capabilities do not exist.

## 6. Design direction and frontend quality

Use the frontend-design skill if installed.

The website should feel like a considered, premium London evening-wear brand rather than a generic AI-generated fashion template.

First derive the visual direction from `brand.md`. Do not impose a different aesthetic simply because it is fashionable.

Prioritise:
- Strong typography and clear hierarchy
- Intentional spacing and composition
- A restrained and consistent colour palette
- High-quality product imagery
- Editorial art direction
- Clear product information
- Thoughtful hover and interaction states
- Consistent components and visual details
- A polished mobile experience

Avoid:
- Generic SaaS layouts
- Excessive gradients and decorative effects
- Emoji used as product imagery
- Unnecessary animation
- Randomly changing typography or colours
- Placeholder content that looks like a finished client claim
- Broken image links and inconsistent image crops

### Homepage

Build a clear journey from the brand introduction to product discovery.

Consider:
- A clear navigation and brand identity
- An editorial hero with a relevant call to action
- Selected products drawn from the real catalogue
- A concise explanation of the brand's made-to-order proposition, if supported by the brief or brand file
- Occasion-based discovery where supported by product attributes
- A route to the AI shopping feature
- A well-finished footer

Every section should have a reason to exist. Avoid adding sections simply to make the page longer.

### Product page

Select one genuine product from `products.json`.

Include, where the source data supports it:
- Product name
- Correct price and currency
- Relevant imagery
- Fabric and product description
- Size options
- Occasion information
- Lead time
- Clear purchase call to action

If sizes are listed in the data, use them accurately. Do not imply that a size is in stock unless the source confirms availability.

Make it clear what happens when the customer selects a size or presses the call to action. If there is no real checkout, implement a clear demonstration interaction rather than pretending a purchase has been completed.

### Responsive design

Design mobile-first.

Test at approximately:
- 375–390 px mobile width
- 768 px tablet width
- 1280 px desktop width

Prevent horizontal overflow, overlapping content, clipped product details and unusable buttons.

### Accessibility

Include:
- Semantic HTML
- Properly labelled controls
- Useful image alt text
- Keyboard-accessible navigation and interactions
- Visible focus states
- Adequate text contrast
- Appropriate heading hierarchy
- Reduced-motion support if animations are present

## 7. Product catalogue and data integrity

Parse `products.json` and inspect its schema before writing product components.

Identify:
- Total number of products
- Available fields
- Missing or inconsistent values
- Price format and currency
- How sizes and occasions are represented
- Whether product images or image references exist

Build a reusable product representation based on the actual schema.

Use real product identifiers and attributes. Do not hard-code a second, conflicting version of the catalogue.

The homepage and product page must use the same source of truth.

If product information is missing:
- Display a clear fallback or omit the field.
- Do not fabricate a replacement value.
- Ensure missing values do not break the layout.

Use suitable licensed free imagery or neutral placeholders. The assessment prohibits using real brands' assets. Credit third-party imagery where required by its licence.

## 8. Analytics investigation

Analyse `analytics.csv` before deciding which changes are likely to increase sales.

Inspect:
- Column names and data types
- Date range and reporting granularity
- Missing values and duplicates
- Whether rows are daily, monthly, channel-based or device-based
- Whether revenue and advertising spend use consistent units
- Whether funnel counts are comparable
- Whether totals contain repeated or aggregated rows

Do not assume that each row is an independent observation.

### Calculate relevant metrics

Where the supplied fields support them, calculate:

- Add-to-cart rate = add-to-cart events / sessions
- Checkout-start rate = checkout events / sessions
- Checkout completion rate = orders / checkout events
- Session conversion rate = orders / sessions
- Average order value = revenue / orders
- Revenue per session = revenue / sessions
- Return on ad spend (ROAS) = attributed revenue / ad spend

Use the actual meaning of each column. If the dataset uses unique users, event counts or a different funnel definition, state that clearly and adapt the formula.

Check for zero denominators, missing values and incompatible aggregations.

For channel and device comparisons, compare equivalent periods and denominators. Do not mistake a larger traffic volume for a better conversion rate.

Do not claim that a marketing channel caused an increase or decrease when the dataset only shows an association.

### Evidence and recommendation rules

Identify specific opportunities in the data. For each potential change, establish:
1. What the data shows.
2. The metric and relevant comparison.
3. Why the observation could indicate a commercial opportunity.
4. What change you propose.
5. Which KPI should improve.
6. How the result will be measured.

Prefer three high-value, evidence-backed recommendations over a long list of generic e-commerce advice.

If the data cannot support a conclusion, explicitly state the limitation rather than inventing certainty.

Save the calculations and important findings in a concise file such as `analysis/sales-findings.md`.

## 9. AI shopping feature

Implement one feature that helps a customer choose a product.

A guided occasion stylist is a suitable option if the catalogue contains useful occasion, size, fabric and price attributes.

The feature could ask the customer for:
- Occasion
- Preferred price range
- Fabric or style preference
- Size, if relevant and supported

It should then recommend suitable products from the supplied catalogue.

### Grounding requirements

The product catalogue is the source of truth.

The assistant must:
- Recommend only products that exist in the catalogue.
- Display the actual catalogue price.
- Use supported product attributes.
- Never invent delivery dates or stock availability.
- Explain when no product matches the stated preferences.
- Ask for clarification when the request is too ambiguous.
- Distinguish a known lead time from a guaranteed arrival date.
- Handle missing catalogue fields honestly.
- Never fabricate reviews, ratings or social proof.

Recommendations should be explainable. For example, explain which known attributes match the customer's stated occasion or preferences.

### Implementation choice

First determine whether a genuine model-backed feature can be implemented safely within the time limit.

If using a model API:
- Keep API keys on the server or in deployment environment variables.
- Never expose secrets in frontend JavaScript or public repository files.
- Use a server-side function or backend endpoint.
- Pass only the necessary catalogue information to the model.
- Instruct the model to use only supplied product facts.
- Validate its output against actual catalogue records before displaying recommendations.
- Handle timeouts, malformed responses, rate limits and unavailable services.
- Never silently substitute fabricated recommendations when the model fails.

If a genuine model-backed integration is not feasible, implement a catalogue-grounded guided recommendation interface as a fallback. Be transparent about whether it uses a real language model or deterministic matching. Do not claim that a rule-based interface is a live AI model.

Do not spend the assessment budget building an elaborate agent architecture.

### User experience

The feature should:
- Be easy to find
- Ask only necessary questions
- Give concise recommendations
- Show product links and prices
- Provide a useful empty state
- Offer a way to refine the results
- Work on mobile
- Explain its limitations when relevant

Test it against known products, impossible preferences, missing attributes and ambiguous requests.

## 10. Security and privacy

- Never commit secrets, API keys or credentials.
- Add appropriate secret files to `.gitignore`.
- Keep private environment variables out of client bundles.
- Avoid collecting unnecessary personal information.
- Do not add analytics tracking that is not needed for the assessment.
- Validate user input and handle API errors safely.
- Do not expose server stack traces or credentials to users.

Use fictional demonstration data only where needed and label it appropriately.

## 11. Commercial plan

Create a one-page document, for example `commercial-plan.md`.

It must contain exactly three primary recommendations, each tied to the actual analytics.

For each recommendation include:
- The observed problem or opportunity
- Supporting numbers and the calculation
- The proposed change
- Why it may improve sales before Black Friday
- The primary success metric
- How the metric will be measured
- A suitable comparison period or experiment where feasible
- Any important caveat

Use achievable measurement plans, such as conversion-rate comparisons, funnel completion or controlled experiments, depending on the available traffic and time.

Do not promise a specific revenue increase without evidence.

Keep the document concise enough to fit on one page when rendered or exported.

## 12. Testing and quality assurance

Do not assume the site works simply because the code compiles.

Run the available checks:
- Dependency installation
- Production build
- Linting and type checks, if configured
- Relevant unit or component tests, if practical
- Local browser testing, if available

Verify:
- Homepage loads
- Product page loads
- Product details match the catalogue
- Navigation works
- Product interactions behave as intended
- The AI feature returns valid recommendations
- Invalid or unsupported requests are handled safely
- Mobile layout has no obvious overflow
- Images load or have graceful fallbacks
- No API secrets are exposed
- No obvious browser console errors remain

Fix critical failures before polishing minor details.

Report any checks you could not perform. Never claim to have tested a browser interaction unless you actually did so.

## 13. Deployment

Deploy to a free hosting provider.

Before deployment:
1. Confirm the production build succeeds.
2. Confirm the correct build and output settings.
3. Ensure no secrets are included in the frontend bundle.
4. Configure server-side environment variables if the AI integration requires them.
5. Check whether the selected host supports any required server-side functions.

After deployment:
- Open the public URL.
- Test the homepage and product page.
- Test the AI feature if its backend is configured.
- Check mobile behaviour.
- Confirm that required routes and assets work.
- Record any remaining limitations.

Do not claim the site is deployed until a real public URL has been obtained and checked.

## 14. Repository and documentation

Provide a concise `README.md` covering:
- Project purpose
- Technology stack
- Installation and local development
- Build and testing commands
- Required environment variables, without their values
- AI feature behaviour and limitations
- Deployment information

Keep source files organised. Remove unused dependencies and temporary files where safe. Do not delete the original assessment inputs.

## 15. Presentation preparation

Prepare a concise 10-minute presentation structure:

1. Brand and customer problem.
2. Homepage and design decisions.
3. Product page and purchase journey.
4. AI feature and how factual accuracy is maintained.
5. Analytics findings and three commercial recommendations.
6. Testing, limitations and what would be cut or improved next.

Explain how each major design or technical decision contributes to the customer experience or commercial goal.

Be prepared to justify:
- Why the chosen product was selected.
- Why the AI feature is useful.
- How recommendations are grounded in the catalogue.
- How the analytics metrics were calculated.
- Why the three recommendations were prioritised.
- What is functional and what is only a demonstration.

## 16. Working style

Work independently on routine implementation details, but keep the user informed of significant decisions.

Before large changes:
- Inspect the existing code.
- Explain the intended change briefly.
- Avoid overwriting working features unnecessarily.

Prefer small, verifiable steps.

When blocked, explain the issue and offer the simplest safe alternative.

At the end of each major stage, summarise:
- What is complete
- What has been tested
- What remains
- Whether the four-hour limit is at risk

The final objective is a credible, polished and commercially grounded submission that works, is honest about its limitations, and can be explained confidently during the assessment.
