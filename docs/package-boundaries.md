# Flowstack OS Package Boundaries

## Standardization rules
- The repo should use one source of truth for package names, pricing, and limits.
- Website copy, chatbot replies, proposals, and AI knowledge should all derive from the same package catalog.
- Any package request outside official limits should be treated as custom scoped work.

## Operational rules
- Website must not imply arbitrary workflow building.
- Operators should not quote old package names or retired price points.
- AI assistants should only recommend Lite, Starter, Growth, or Scale.

## Next implementation rule
- Any new pricing or service copy update should happen in `services/catalog.ts` first.
