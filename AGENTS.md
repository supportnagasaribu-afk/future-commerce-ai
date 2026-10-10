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

- Keep the public homepage concept frontend-only, with deterministic sample interactions and explicitly labeled demo data. The `/members` route is the production-oriented Supabase-backed member area; preserve this boundary.
- Never expose Supabase secret or service-role keys in browser code. Use RLS and verified `app_metadata` for authorization; never trust user-editable `user_metadata` for roles.
- Keep member-area schema changes in `supabase/migrations/` and ensure each exposed table has explicit grants and row-level security.
- Use semantic tokens in src/styles.css and shared UI controls for the commerce visual system, keeping the design consistent across sections.
- Keep the homepage experience at the index route and use anchors for its related sections; informational prototype dialogs must not imply completed registration or transactions.
