#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { tmpdir } from 'node:os'

function buildArgs(userArgs = [], outputPath) {
  const filtered = []
  let hasMaxWarnings = false
  let failOnWarn = false

  for (const arg of userArgs) {
    if (arg === '--fail-on-warn') {
      failOnWarn = true
      continue
    }
    if (arg === '-f' || arg === '--format' || arg === '-o' || arg === '--output-file') {
      // omit format/output overrides to keep JSON capture consistent
      continue
    }
    if (arg.startsWith('--max-warnings')) {
      hasMaxWarnings = true
    }
    filtered.push(arg)
  }

  if (failOnWarn && !hasMaxWarnings) {
    filtered.push('--max-warnings=0')
  }

  return [
    '--silent',
    'exec',
    'eslint',
    '.',
    ...filtered,
    '--format',
    'json',
    '--output-file',
    outputPath
  ]
}

async function run() {
  const tempDir = await mkdtemp(join(tmpdir(), 'lint-report-'))
  const tempOutput = join(tempDir, 'eslint-report.json')

  const args = buildArgs(process.argv.slice(2), tempOutput)
  const eslint = spawn('pnpm', args, {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: {
      ...process.env,
      FORCE_COLOR: '0'
    }
  })

  const chunks = []
  eslint.stdout.on('data', (chunk) => chunks.push(chunk))

  const exitCode = await new Promise((resolveExit) => {
    eslint.on('close', resolveExit)
  })

  let rawOutput = Buffer.concat(chunks).toString('utf8').trim()
  let fileOutput = ''

  try {
    fileOutput = await readFile(tempOutput, 'utf8')
  } catch (error) {
    if (rawOutput.length === 0) {
      console.warn('[lint-report] No se encontró el archivo de salida de ESLint, usando stdout capturado.')
    }
  }

  const normalizedOutput = (fileOutput ?? '').trim().length > 0 ? fileOutput.trim() : rawOutput
  const reportDir = resolve(process.cwd(), '.reports/lint')
  const reportPath = resolve(reportDir, 'latest.json')

  await mkdir(reportDir, { recursive: true })

  let parsedResults = []
  let rawJson = normalizedOutput

  if (rawJson.length === 0) {
    rawJson = rawOutput
  }

  if (rawJson.length > 0) {
    try {
      parsedResults = JSON.parse(rawJson)
    } catch (error) {
      const jsonStart = rawJson.indexOf('[')
      const jsonEnd = rawJson.lastIndexOf(']')

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
        const candidate = rawJson.slice(jsonStart, jsonEnd + 1)
        try {
          parsedResults = JSON.parse(candidate)
        } catch (nestedError) {
          console.error('\n[lint-report] No se pudo parsear la salida JSON de ESLint (intento secundario):', nestedError)
          console.error('Salida cruda capturada:\n', rawJson)
        }
      } else {
        console.error('\n[lint-report] No se pudo parsear la salida JSON de ESLint:', error)
        console.error('Salida cruda capturada:\n', rawJson)
      }
    }
  }

  const summary = parsedResults.reduce(
    (acc, file) => {
      acc.errorCount += file.errorCount ?? 0
      acc.warningCount += file.warningCount ?? 0
      acc.fixableErrorCount += file.fixableErrorCount ?? 0
      acc.fixableWarningCount += file.fixableWarningCount ?? 0
      return acc
    },
    { errorCount: 0, warningCount: 0, fixableErrorCount: 0, fixableWarningCount: 0 }
  )

  const payload = {
    generatedAt: new Date().toISOString(),
    exitCode,
    summary,
    results: parsedResults
  }

  await writeFile(reportPath, JSON.stringify(payload, null, 2), 'utf8')

  if (parsedResults.length) {
    console.log(`\n[lint-report] Total errores: ${summary.errorCount}, warnings: ${summary.warningCount}`)
    console.log(`[lint-report] Reporte guardado en ${reportPath}`)
  } else {
    console.log('\n[lint-report] ESLint no produjo resultados JSON; se guardó estructura vacía.')
  }

  if ((exitCode ?? 1) !== 0 && parsedResults.length) {
    console.error('\n[lint-report] Detalle de infracciones:')
    for (const file of parsedResults) {
      for (const message of file.messages ?? []) {
        const location = `${file.filePath}:${message.line ?? 0}:${message.column ?? 0}`
        const rule = message.ruleId ? ` (${message.ruleId})` : ''
        console.error(`  - ${location} → ${message.message}${rule}`)
      }
    }
  }

  await rm(tempDir, { recursive: true, force: true })

  process.exit(exitCode ?? 1)
}

run().catch((error) => {
  console.error('[lint-report] Error inesperado al generar el reporte:', error)
  process.exit(1)
})
