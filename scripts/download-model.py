"""Download public Apache-2.0 model artifacts; no credentials or remote scripts."""
import hashlib
import json
import urllib.request
from pathlib import Path

REPO = 'Xenova/all-MiniLM-L6-v2'
REVISION = '751bff37182d3f1213fa05d7196b954e230abad9'
FILES = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'onnx/model_quantized.onnx']
ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'model-manifest.json').read_text())
expected = {item['file']: item['sha256'] for item in manifest['files']}
records = []
for name in FILES:
    target = ROOT / 'public/models' / REPO / name
    target.parent.mkdir(parents=True, exist_ok=True)
    url = f'https://huggingface.co/{REPO}/resolve/{REVISION}/{name}'
    with urllib.request.urlopen(url, timeout=120) as response:
        data = response.read(40_000_001)
    if len(data) > 40_000_000:
        raise RuntimeError('Artifact exceeds the 40 MB download cap')
    digest = hashlib.sha256(data).hexdigest()
    if digest != expected[name]:
        raise RuntimeError(f'Checksum mismatch for {name}; nothing written')
    target.write_bytes(data)
    records.append({'file': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    print(name, len(data), 'bytes')
print('Verified every artifact against model-manifest.json')
