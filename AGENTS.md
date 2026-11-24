<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep PostPilot's first-screen workspace and its navigation within the index route, with mock records and simulated API functions isolated in `src/lib/mockApi.ts`; this keeps the requested UI-only experience usable without adding backend dependencies.

- **STRICT INDUSTRY-STANDARD TESTING RULE**: Whenever you create any new feature, update an existing feature, or modify API functions, logic, or data models, you MUST create or update the corresponding `*.test.ts` file (e.g. `[filename].test.ts`). You MUST write unit/integration tests for the APIs, logic, edge cases, and user constraints, and run `npm run test` (Vitest) to verify that all tests pass. No feature or change is considered complete without passing automated tests.
