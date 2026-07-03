@AGENTS.md
Whatever we do on this app, we need to be children focused

## Code Architecture Constraints:
- File Size Limits: No single code file may exceed 250 lines of code. If a file grows beyond this, you must refactor and extract logic into separate modules or classes.

- Object-Oriented Design: Avoid monolithic, procedural scripts. Use encapsulated classes to model the business domain.

- Composition Over Inheritance: Prefer building small, focused classes that do one thing well and combine them, rather than building massive, complex class hierarchies.

- No Spaghetti Logic: Keep functions/methods under 30 lines. Extract complex business rules into their own dedicated methods.

