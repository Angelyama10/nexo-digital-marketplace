import { performance } from 'node:perf_hooks';

type Stage = {
  name: string;
  concurrency: number;
  requestsPerWorker?: number;
  durationMs?: number;
};

type Sample = {
  latencyMs: number;
  status: number;
  error?: string;
};

const profiles: Record<string, Stage[]> = {
  smoke: [
    { name: 'smoke', concurrency: 5, requestsPerWorker: 10 },
  ],
  ramp: [10, 25, 50, 100].map((concurrency) => ({
    name: `ramp-${concurrency}`,
    concurrency,
    requestsPerWorker: 5,
  })),
  sustained: [
    { name: 'sustained', concurrency: 50, durationMs: 30_000 },
  ],
  spike: [
    { name: 'baseline', concurrency: 10, requestsPerWorker: 5 },
    { name: 'spike', concurrency: 200, requestsPerWorker: 2 },
  ],
  stress: [50, 100, 250, 500].map((concurrency) => ({
    name: `stress-${concurrency}`,
    concurrency,
    requestsPerWorker: 3,
  })),
  soak: [
    { name: 'soak', concurrency: 50, durationMs: 60_000 },
  ],
};

const target = process.env.LOAD_TARGET ?? 'http://audit-app:3000';
const profileName = process.env.LOAD_PROFILE ?? 'smoke';
const paths = (process.env.LOAD_PATHS ?? '/api/products').split(',').map((path) => path.trim()).filter(Boolean);
const timeoutMs = Number(process.env.LOAD_TIMEOUT_MS ?? 3_000);
const stages = profiles[profileName];

if (!stages) {
  throw new Error(`Unknown LOAD_PROFILE: ${profileName}`);
}
if (paths.length === 0) {
  throw new Error('LOAD_PATHS must contain at least one path.');
}

function percentile(sorted: number[], value: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((value / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function request(index: number): Promise<Sample> {
  const path = paths[index % paths.length];
  const startedAt = performance.now();
  try {
    const response = await fetch(`${target}${path}`, {
      headers: { accept: 'application/json', 'user-agent': 'nexo-local-load-audit/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.arrayBuffer();
    return { latencyMs: performance.now() - startedAt, status: response.status };
  } catch (error: unknown) {
    return {
      latencyMs: performance.now() - startedAt,
      status: 0,
      error: error instanceof Error ? error.name : 'UnknownError',
    };
  }
}

async function runStage(stage: Stage): Promise<Record<string, unknown>> {
  const samples: Sample[] = [];
  const stageStartedAt = performance.now();
  let sequence = 0;

  async function worker(): Promise<void> {
    if (stage.durationMs) {
      while (performance.now() - stageStartedAt < stage.durationMs) {
        samples.push(await request(sequence++));
      }
      return;
    }

    for (let attempt = 0; attempt < (stage.requestsPerWorker ?? 1); attempt += 1) {
      samples.push(await request(sequence++));
    }
  }

  await Promise.all(Array.from({ length: stage.concurrency }, () => worker()));
  const elapsedMs = performance.now() - stageStartedAt;
  const latencies = samples.map((sample) => sample.latencyMs).sort((left, right) => left - right);
  const statusCounts = samples.reduce<Record<string, number>>((counts, sample) => {
    const key = sample.status === 0 ? `error:${sample.error ?? 'unknown'}` : String(sample.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const failed = samples.filter((sample) => sample.status === 0 || sample.status >= 500).length;

  return {
    stage: stage.name,
    concurrency: stage.concurrency,
    requests: samples.length,
    durationSeconds: Number((elapsedMs / 1_000).toFixed(3)),
    rps: Number((samples.length / (elapsedMs / 1_000)).toFixed(2)),
    latencyMs: {
      average: Number((latencies.reduce((sum, latency) => sum + latency, 0) / Math.max(1, latencies.length)).toFixed(2)),
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p90: Number(percentile(latencies, 90).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2)),
      max: Number((latencies.at(-1) ?? 0).toFixed(2)),
    },
    errors: failed,
    errorRate: Number((failed / Math.max(1, samples.length)).toFixed(6)),
    statusCounts,
  };
}

async function main(): Promise<void> {
  const results = [];
  for (const stage of stages) {
    results.push(await runStage(stage));
  }

  console.log(JSON.stringify({
    target,
    paths,
    profile: profileName,
    generatedAt: new Date().toISOString(),
    results,
  }, null, 2));

  const hasTransportOrServerErrors = results.some((result) => Number(result.errorRate) > 0);
  if (hasTransportOrServerErrors) process.exitCode = 1;
}

void main();
