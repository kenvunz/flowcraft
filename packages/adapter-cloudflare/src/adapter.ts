import type { AdapterOptions, JobPayload, WorkflowResult } from 'flowcraft'
import { BaseDistributedAdapter } from 'flowcraft'
import { DurableObjectContext, type DurableObjectStorage } from './context'
import type { KVCoordinationStoreOptions, KVNamespace } from './store'

export interface CloudflareQueueAdapterOptions extends AdapterOptions {
	queue: CloudflareQueue
	durableObjectStorage: DurableObjectStorage
	kvNamespace: KVNamespace
	queueName: string
	statusKVNamespace: KVNamespace
	statusPrefix?: string
}

export interface CloudflareQueue {
	send(message: unknown): Promise<void>
}

function getStatusKey(runId: string, prefix = 'flowcraft:status:'): string {
	return `${prefix}${runId}`
}

export class CloudflareQueueAdapter extends BaseDistributedAdapter {
	private readonly queue: CloudflareQueue
	private readonly durableObjectStorage: DurableObjectStorage
	private readonly kvNamespace: KVNamespace
	private readonly queueName: string
	private readonly statusKVNamespace: KVNamespace
	private readonly statusPrefix: string
	private isPolling = false
	private pollInterval?: ReturnType<typeof setInterval>

	constructor(options: CloudflareQueueAdapterOptions) {
		super(options)
		this.queue = options.queue
		this.durableObjectStorage = options.durableObjectStorage
		this.kvNamespace = options.kvNamespace
		this.queueName = options.queueName
		this.statusKVNamespace = options.statusKVNamespace
		this.statusPrefix = options.statusPrefix ?? 'flowcraft:status:'
		this.logger.info(`[CloudflareQueueAdapter] Initialized for queue: ${this.queueName}`)
	}

	protected createContext(runId: string): DurableObjectContext {
		return new DurableObjectContext(runId, {
			storage: this.durableObjectStorage,
			runId,
		})
	}

	protected async enqueueJob(job: JobPayload): Promise<void> {
		await this.queue.send(job)
	}

	protected async onJobStart(_runId: string, _blueprintId: string, _nodeId: string): Promise<void> {
		try {
			const statusKey = getStatusKey(_runId, this.statusPrefix)
			const current = await this.statusKVNamespace.get(statusKey, 'text')
			const status = current ? JSON.parse(current) : {}
			status.status = 'running'
			status.lastUpdated = Math.floor(Date.now() / 1000)
			await this.statusKVNamespace.put(statusKey, JSON.stringify(status), { expirationTtl: 86400 })
		} catch (error) {
			this.logger.error(`[CloudflareQueueAdapter] Failed to update lastUpdated timestamp for Run ID ${_runId}`, {
				error,
			})
		}
	}

	protected async publishFinalResult(
		runId: string,
		result: { status: string; payload?: WorkflowResult; reason?: string },
	): Promise<void> {
		const statusKey = getStatusKey(runId, this.statusPrefix)
		const status = {
			finalStatus: result,
			status: result.status,
			lastUpdated: Math.floor(Date.now() / 1000),
		}
		await this.statusKVNamespace.put(statusKey, JSON.stringify(status), { expirationTtl: 86400 })
		this.logger.info(`[CloudflareQueueAdapter] Published final result for Run ID ${runId}.`)
	}

	public async registerWebhookEndpoint(_runId: string, _nodeId: string): Promise<{ url: string; event: string }> {
		throw new Error('registerWebhookEndpoint not implemented for CloudflareAdapter')
	}

	protected processJobs(handler: (job: JobPayload) => Promise<void>): void {
		if (this.isPolling) {
			this.logger.warn('[CloudflareQueueAdapter] Polling is already active.')
			return
		}
		this.isPolling = true
		this.logger.info('[CloudflareQueueAdapter] Worker starting to poll for jobs...')

		this.poll(handler)
	}

	private async poll(handler: (job: JobPayload) => Promise<void>): Promise<void> {
		this.pollInterval = setInterval(async () => {
			await this.fetchAndProcessMessages(handler)
		}, 5000)

		await this.fetchAndProcessMessages(handler)
	}

	private async fetchAndProcessMessages(_handler: (job: JobPayload) => Promise<void>): Promise<void> {
		// In a real implementation, this would use Cloudflare's queue consumer API
		// For now, this is a placeholder that can be extended
		// The actual queue consumption would typically be triggered by the Cloudflare runtime
	}

	public stop(): void {
		this.logger.info('[CloudflareQueueAdapter] Stopping worker polling.')
		this.isPolling = false
		if (this.pollInterval) {
			clearInterval(this.pollInterval)
			this.pollInterval = undefined
		}
	}
}

export function createKVCoordinationStoreOptions(namespace: KVNamespace): KVCoordinationStoreOptions {
	return { namespace }
}
