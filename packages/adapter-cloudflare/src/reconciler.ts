import type { CloudflareQueueAdapter } from './adapter'
import type { KVNamespace } from './store'

export interface CloudflareReconcilerOptions {
	adapter: CloudflareQueueAdapter
	statusKVNamespace: KVNamespace
	statusPrefix?: string
	stalledThresholdSeconds: number
}

export interface ReconciliationStats {
	stalledRuns: number
	reconciledRuns: number
	failedRuns: number
}

export function createCloudflareReconciler(options: CloudflareReconcilerOptions) {
	const { adapter, statusKVNamespace, statusPrefix = 'flowcraft:status:', stalledThresholdSeconds } = options

	return {
		async run(): Promise<ReconciliationStats> {
			const stats: ReconciliationStats = {
				stalledRuns: 0,
				reconciledRuns: 0,
				failedRuns: 0,
			}

			const thresholdTimestamp = Math.floor(Date.now() / 1000) - stalledThresholdSeconds

			const listResult = await statusKVNamespace.list({ prefix: statusPrefix })
			const stalledRunIds: string[] = []

			for (const key of listResult.keys) {
				const runId = key.name.replace(statusPrefix, '')
				const statusJson = await statusKVNamespace.get(key.name, 'text')

				if (!statusJson) continue

				try {
					const status = JSON.parse(statusJson)
					if (status.status === 'running' && status.lastUpdated < thresholdTimestamp) {
						stalledRunIds.push(runId)
					}
				} catch {}
			}

			if (stalledRunIds.length === 0) {
				return stats
			}

			for (const runId of stalledRunIds) {
				stats.stalledRuns++
				try {
					const enqueued = await (adapter as any).reconcile(runId)
					if (enqueued.size > 0) {
						stats.reconciledRuns++
						console.log(`[CloudflareReconciler] Resumed run ${runId}, enqueued nodes: ${[...enqueued].join(', ')}`)
					}
				} catch (error) {
					stats.failedRuns++
					console.error(`[CloudflareReconciler] Failed to reconcile run ${runId}:`, error)
				}
			}

			return stats
		},
	}
}
