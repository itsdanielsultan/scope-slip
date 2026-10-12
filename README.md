# Scope Slip

Scope Slip matches a short client request with a fictional service catalogue, then lets a freelancer select a service, edit a work outline and download it as Markdown.

An open MiniLM model runs in a browser worker. Request text and edits stay in tab memory; the app does not send them to a model service, log them or save them. Public model/runtime assets download on first use and may be retained in the browser cache. Clearing that cache can cause another download.

The catalogue and starting outline text are authored examples, not generated prose or real customer work. Matching uses actual embeddings and cosine ranking, with no keyword/mock fallback or confidence percentage. Requests are limited to 800 characters. Users review the suggested service and edit the outline before using it.

## Model and implementation

- React + Vite; a dedicated module worker keeps inference off the main thread.
- [`@huggingface/transformers@3.8.1`](https://github.com/huggingface/transformers.js).
- [`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2), pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`, q8/WASM, mean pooling and normalization.
- Seven fictional services; each request is compared with every service. The closest three appear, and selection/edit/download remain local.
- Superseded results are ignored; pending work is rejected and the worker terminated on unmount. There is no model-failure fallback presented as AI output.

## Development

Node 24 and pnpm 11.25.0 were used. Dependencies are pinned and locked; unused Node-only inference/image backends are excluded because the app uses the published browser export.

```sh
pnpm install --ignore-scripts --registry=https://registry.npmjs.org
pnpm test
pnpm lint
pnpm build
pnpm dev
```

The development server uses `http://127.0.0.1:4320`. For a GitHub Pages project mounted at `/scope-slip/`, build with:

```sh
pnpm exec vite build --base=/scope-slip/
```

The 22 unit tests cover math/ranking/input validation, editable safe Markdown export and worker transport lifecycle. They do not substitute for real model execution. The request → match → select → edit → download flow was separately checked in a real local browser on desktop and mobile. Public deployment is a separate verification step.

## Authorship and licence

ChatGPT in Codex substantially generated the concept, implementation, fictional catalogue, tests and documentation. No customers, sales, revenue or firsthand user feedback are claimed. The project began during the Hacktoberfest Week 2 window; it is a new project rather than an update to an earlier entry.

Project code: [MIT](LICENSE). Dependencies, model assets and Bricolage Grotesque fonts keep their original licences: see [third-party notices](THIRD_PARTY_NOTICES.md) and the [complete distributable bundle](public/legal/THIRD_PARTY_NOTICES.txt).
