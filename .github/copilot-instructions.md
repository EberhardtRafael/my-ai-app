# Copilot Instructions

## Toolkit-First Development (Required)
- Always use existing shared components from `src/components/ui` whenever possible.
- Before writing raw HTML tags in feature code (`button`, `a`, `ul`, `ol`, `li`, etc.), check whether a toolkit component already exists for that use case.
- Prefer extending existing toolkit APIs over creating parallel one-off implementations.

## Component Architecture Rules
- Keep components focused and composable.
- Do not keep multiple JSX/UI return paths in the same component body when that logic can be extracted.
- Prefer one main JSX return per component and extract conditional branches or repeated blocks into separate components.
- If markup grows complex or repeated, extract it into a dedicated reusable component.
- **Avoid Deep Nesting ("Closing Tag Ladder")**: When you see many levels of closing tags stacked vertically (e.g., `</div></div></Card>`), it signals the component is too complex. Extract deeply nested blocks, especially inside `.map()` callbacks, into dedicated components. A `.map()` callback with >30 lines of JSX should typically become its own component.
- **Use the Orchestrator + Slice Pattern**: When a component starts rendering multiple distinct UI sections (header, list rows, summary, actions, etc.), split it into:
	1) an **orchestrator component** that composes sections,
	2) small **slice components** that each own one section.
	The orchestrator should mostly wire props and layout; slice components should contain section-specific markup.
- **Decomposition Triggers**: Refactor when any of these appear:
	- more than ~3 visual sections in one component,
	- repeated nested wrappers that create a closing-tag ladder,
	- `.map()` callbacks with complex markup,
	- mixed responsibilities (formatting, business display rules, and layout) in one JSX block.
- **Component Boundaries**: Keep each slice component single-purpose and predictable:
	- prefer one responsibility per component,
	- keep data shape consistent with source models unless a clear adapter is introduced,
	- place mapped display arrays/constants near the slice that consumes them,
	- avoid pushing conditional rendering complexity back into the orchestrator.
- **Component Unification Pattern (Configuration-Driven Factory)**: When multiple components share the same layout/shell and differ mainly by variant-specific content or copy, unify them behind one factory/coordinator component.
	- Use one entry component with a `variant` prop and a `variantConfigs` map.
	- Keep shared wrapper/layout in the factory; move variant-specific rendering into config-driven renderers.
	- Prefer thin compatibility wrappers only when needed for gradual migration.
	- Use this pattern for **variants of one section** (loading/error/empty/success), not for unrelated page sections.
	- If a component contains multiple distinct sections, prefer **Orchestrator + Slice** instead of a variant factory.

## State Communication Rules (Required)
- Never use browser or global event listeners (`window.addEventListener`, `document.addEventListener`, `CustomEvent`, etc.) for app state communication.
- For cross-component state and signals, use container state via React Context/provider patterns.
- Prefer explicit state flow through context/hooks over pub/sub-style event broadcasting.

## Clean Code & Maintainability
- Apply appropriate design patterns where they improve readability and maintainability.
- Prioritize code that is elegant, readable, maintainable, and understandable by humans.
- Avoid duplication (DRY). If similar structures appear more than once, refactor into reusable components/helpers.
- Keep implementations clean and low-bureaucracy: minimal, clear abstractions over scattered ad hoc code.
- **Extract Mapped Data**: When mapping over an array/object in JSX, extract it to a named constant above the JSX with a meaningful name (e.g., `shippingAddressLines`, `paymentBreakdownLines`, `navigationItems`). Inline arrays should only be used for simple, obvious cases (2-3 static items max).

## Styling & Consistency
- Reuse existing component primitives and variants for consistent behavior and styling.
- Avoid one-off UI patterns when a shared component can be used.
- Keep visual and interaction patterns aligned with the existing design system.

## Proactive Refactor Suggestions
- When editing any area, actively look for nearby opportunities to improve structure based on the rules above.
- Proactively suggest project-wide refactors when you identify repeated anti-patterns.
