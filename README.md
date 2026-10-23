# HomeCue

**A shared home. A lighter mental load.**

HomeCue is a working typed Alexa+ concept simulation with fictional people and tasks. A local MiniLM model routes short requests to bounded tools for planning, handoff, proposed completion, explicit confirmation and Undo. It has no Alexa account, microphone, messaging, payment or device connection.

## Run locally

Use Node 24.18+ and Python 3 on macOS arm64 (other platforms unverified). Initial dependency/model downloads need internet; inference then uses local files.

```sh
npm ci --ignore-scripts
npm run model:download
npm run lint
npm test
npm run test:model
npm run build
npm run test:wasm
npm run test:server
npm run preview
```

Open http://127.0.0.1:4318. No account or API key is required. The downloader verifies the model revision and file hashes in `model-manifest.json`; build stages the local WASM runtime.

## Demonstration

1. Ask “Plan a ten minute reset in the kitchen.” The plan fits the budget, excludes Jamie’s assigned work and leaves the board unchanged.
2. Ask “I finished clearing the table.” A proposal appears; tasks remain unchanged.
3. Select **Confirm completion**. The board changes from 0/6 to 1/6; the trace records explicit confirmation and the revision.
4. Ask “Undo the last change” and select **Undo last completion**. The table returns to open and the board to 0/6.
5. Ask “What is left for me to do?” for the handoff.
6. Ask “Send a message to Jamie.” The app explains that it cannot contact anyone, buy things or operate devices.

## Architecture

Vanilla JavaScript and Vite; Transformers.js/MiniLM embeddings executed locally through ONNX/WASM. Deterministic tools enforce time budgets, ownership and proposal revisions. Responses are templates grounded in actual tool results. The tool trace exposes those calls. State is stored in one browser tab’s localStorage; there is no multi-user/device synchronization. Reload restores validated task statuses and discards pending proposals/undo authority.

## Verification and limits

October 22, 2026: lint, 12 unit/DOM tests, 8 authored actual-model CPU cases plus a plan/propose/confirm/Undo workflow, real Node WASM, production build, an 11-resource loopback HTTP smoke test and 5 pinned model hashes passed. DOM tests use a mock inference adapter. Four semantic cases reuse intent examples; this is not a general accuracy benchmark.

October 13 real-browser QA checked cold/warm local MiniLM q8 inference, 1280×720 desktop and 390×844 mobile emulation, keyboard use, proposal/cancel/confirm/Undo/reload, repeated inputs, ownership refusal and controlled WASM failure/recovery. The October 22 rebuilt HTML/JS/CSS matched that tested build byte for byte. No new browser session was available October 22.

The current English demonstration candidate is 140 seconds with burned-in captions and no audio track. Prior system narration was removed because public-use rights were not established; the earlier audio cut is retained privately on publication hold. Chronological normal-speed cuts preserve the real workflow. It is a typed simulation, not live Alexa/voice/device validation.

Known limits: small English intent set; vague Jamie-completion wording routed to handoff while concrete Jamie-owned tasks were refused without mutation. Two DevTools Issues were not inspected; an extension-origin `ethereum` error was observed. No physical-phone, exhaustive network, deterministic concurrent-race or cold-latency benchmark is claimed. Clean-machine downloads and a fresh dependency advisory audit were not repeated in the final gate.

## License and provenance

Started October 11, 2026 as a separate prototype. Application source is MIT; dependencies and model retain their licenses. See `LICENSE`, `THIRD_PARTY_NOTICES.md`, `licenses/` and the pinned model manifest. Model weights, dependencies, build outputs, private recordings, account/configuration data and development handoff notes are not included; setup downloads/stages required runtime assets.
