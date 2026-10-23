# Third-party notices

Application source is MIT; third-party libraries and model weights retain their own licenses. No third-party logos, photos or music are included.

- Transformers.js 4.3.1 — Hugging Face, Apache-2.0. https://github.com/huggingface/transformers.js
- MiniLM / Xenova all-MiniLM-L6-v2 — sentence-transformers model, ONNX conversion by Xenova, Apache-2.0. https://huggingface.co/Xenova/all-MiniLM-L6-v2 and https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 . Exact revision and hashes are in model-manifest.json. Weights are not committed; the downloader obtains them without modification.
- ONNX Runtime — Microsoft contributors, MIT. https://github.com/microsoft/onnxruntime
- Vite — Vite contributors, MIT. https://github.com/vitejs/vite
- ESLint — OpenJS Foundation and contributors, MIT. https://github.com/eslint/eslint
- jsdom — jsdom contributors, MIT. https://github.com/jsdom/jsdom

Copies of the inference runtime licenses are in licenses/. Dependencies and their transitive license files remain in node_modules after npm ci. Preserve license files when distributing a build containing third-party runtime assets or the model. Inspect the full dependency inventory in package-lock.json before publication.
