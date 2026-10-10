Read CLAUDE.md and everything in docs/. This is a read-only planning session. Do not edit files, install packages, scaffold the project, or create any cloud resources.

The architecture and stack are already decided (see CLAUDE.md and doc 04). Don't re-compare options. Your job is to stress-test the plan and get us ready to build step 1.

1. In under 300 words, summarise the product, the users (super-admin vs club editor vs public visitor) and the tenancy model, so I can confirm you've understood them.
2. List any contradictions between documents, and anything in the docs that is ambiguous enough to block steps 1–2 of the build order.
3. Evaluate Payload's official multi-tenant plugin against hand-rolled tenant access control for our requirements, especially the "editor cannot discover other tenants exist" rule. Recommend one.
4. Propose a detailed plan for build step 1 only: repo scaffold, GitHub Actions merge gate (typecheck, lint, tests, secret scan, dependency scan), and Vercel and Neon staging/production setup. Mark which actions I must do myself in a dashboard and which you can do.
5. List the accounts and access I need to set up before you start step 1, in order.
6. List what my devops contact should own or review in steps 1–3.

Separate facts from assumptions. Ask me your most important questions at the end, at most five.
