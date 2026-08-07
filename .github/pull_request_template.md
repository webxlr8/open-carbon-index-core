## What this changes

<!-- One or two sentences. -->

## Does this change any published grade?

<!-- Delete whichever doesn't apply. -->

- [ ] No — refactor, docs, tooling or tests only.
- [ ] Yes — and I've explained below why the new behaviour is more correct,
      and added a CHANGELOG entry under "Changed — affects grades".

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` all pass
- [ ] The co2.js parity test still passes (or I've explained why the
      reference implementation is wrong)
- [ ] Any `data/` change was generated with `pnpm data:grid` / `pnpm data:ip`,
      not hand-edited
- [ ] New behaviour has a test
