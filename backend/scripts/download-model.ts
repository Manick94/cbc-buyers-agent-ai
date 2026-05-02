import path from 'path'
import fs from 'fs'

const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct'
const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main`
const MODEL_DIR = path.resolve(process.cwd(), '../models', MODEL_ID)

const FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'special_tokens_map.json',
  'generation_config.json',
  'onnx/model_q4.onnx',
]

const HF_TOKEN = process.env.HF_TOKEN

async function downloadFile(remotePath: string) {
  const localPath = path.join(MODEL_DIR, remotePath)
  const dir = path.dirname(localPath)
  fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(localPath)) {
    const stat = fs.statSync(localPath)
    console.log(`  skip ${remotePath} (${(stat.size / 1024 / 1024).toFixed(1)}MB already downloaded)`)
    return
  }

  const url = `${BASE_URL}/${remotePath}`
  process.stdout.write(`  downloading ${remotePath}...`)

  const headers: Record<string, string> = {}
  if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`

  const response = await fetch(url, { headers, redirect: 'follow' })

  if (response.status === 401 || response.status === 403) {
    console.error(`\n\n  ✗ Authentication required (HTTP ${response.status})`)
    console.error(`\n  This model requires a HuggingFace account and license acceptance:`)
    console.error(`  1. Create a free account at https://huggingface.co`)
    console.error(`  2. Accept the model license at https://huggingface.co/${MODEL_ID}`)
    console.error(`  3. Get a token at https://huggingface.co/settings/tokens`)
    console.error(`  4. Re-run with:  HF_TOKEN=<your_token> npm run download-model\n`)
    process.exit(1)
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  const buffer = await response.arrayBuffer()
  fs.writeFileSync(localPath, Buffer.from(buffer))
  console.log(` done (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB)`)
}

async function main() {
  console.log(`\nDownloading ${MODEL_ID}`)
  console.log(`Destination: ${MODEL_DIR}\n`)

  if (!HF_TOKEN) {
    console.warn('  Note: HF_TOKEN not set. Public repos work; gated repos need HF_TOKEN=<token>\n')
  }

  for (const file of FILES) {
    await downloadFile(file)
  }

  console.log(`\n✓ Model ready. Restart backend, then select "ONNX Local" in Settings.\n`)
}

main().catch(err => {
  console.error('Download failed:', err.message)
  process.exit(1)
})
