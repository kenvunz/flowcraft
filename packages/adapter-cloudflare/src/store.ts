import type { ICoordinationStore } from 'flowcraft'

export interface KVNamespace {
	get(key: string, type?: 'text'): Promise<string | null>
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
	delete(key: string): Promise<void>
	list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>
}

export interface KVCoordinationStoreOptions {
	namespace: KVNamespace
}

export class KVCoordinationStore implements ICoordinationStore {
	private readonly namespace: KVNamespace

	constructor(options: KVCoordinationStoreOptions) {
		this.namespace = options.namespace
	}

	async increment(key: string, ttlSeconds: number): Promise<number> {
		const current = await this.namespace.get(key, 'text')
		const currentValue = current ? parseInt(current, 10) : 0
		const newValue = currentValue + 1

		await this.namespace.put(key, newValue.toString(), { expirationTtl: ttlSeconds })
		return newValue
	}

	async setIfNotExist(key: string, value: string, ttlSeconds: number): Promise<boolean> {
		const existing = await this.namespace.get(key, 'text')
		if (existing !== null) {
			return false
		}

		try {
			await this.namespace.put(key, value, { expirationTtl: ttlSeconds })
			const verify = await this.namespace.get(key, 'text')
			return verify === value
		} catch {
			return false
		}
	}

	async delete(key: string): Promise<void> {
		await this.namespace.delete(key)
	}

	async extendTTL(key: string, ttlSeconds: number): Promise<boolean> {
		const current = await this.namespace.get(key, 'text')
		if (current === null) {
			return false
		}

		await this.namespace.put(key, current, { expirationTtl: ttlSeconds })
		return true
	}

	async get(key: string): Promise<string | undefined> {
		const value = await this.namespace.get(key, 'text')
		return value ?? undefined
	}
}
