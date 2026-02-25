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

## State Communication Rules (Required)
- Never use browser or global event listeners (`window.addEventListener`, `document.addEventListener`, `CustomEvent`, etc.) for app state communication.
- For cross-component state and signals, use container state via React Context/provider patterns.
- Prefer explicit state flow through context/hooks over pub/sub-style event broadcasting.

## Clean Code & Maintainability
- Apply appropriate design patterns where they improve readability and maintainability.
- Prioritize code that is elegant, readable, maintainable, and understandable by humans.
- Avoid duplication (DRY). If similar structures appear more than once, refactor into reusable components/helpers.
- Keep implementations clean and low-bureaucracy: minimal, clear abstractions over scattered ad hoc code.

## Styling & Consistency
- Reuse existing component primitives and variants for consistent behavior and styling.
- Avoid one-off UI patterns when a shared component can be used.
- Keep visual and interaction patterns aligned with the existing design system.

## Proactive Refactor Suggestions
- When editing any area, actively look for nearby opportunities to improve structure based on the rules above.
- Proactively suggest project-wide refactors when you identify repeated anti-patterns.
