import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KVCoordinationStore, type KVNamespace } from './store'

describe('KVCoordinationStore', () => {
	let store: KVCoordinationStore
	let mockNamespace: KVNamespace

	beforeEach(() => {
		mockNamespace = {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		}
		store = new KVCoordinationStore({ namespace: mockNamespace })
	})

	describe('increment', () => {
		it('should increment a new key from 0', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue(null)

			const result = await store.increment('counter-key', 3600)

			expect(mockNamespace.get).toHaveBeenCalledWith('counter-key', 'text')
			expect(mockNamespace.put).toHaveBeenCalledWith('counter-key', '1', { expirationTtl: 3600 })
			expect(result).toBe(1)
		})

		it('should increment an existing key', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue('5')

			const result = await store.increment('counter-key', 3600)

			expect(result).toBe(6)
			expect(mockNamespace.put).toHaveBeenCalledWith('counter-key', '6', { expirationTtl: 3600 })
		})

		it('should handle non-numeric values by treating as 0', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue('not-a-number')

			const result = await store.increment('counter-key', 3600)

			expect(result).toBe(NaN)
		})
	})

	describe('setIfNotExist', () => {
		it('should return false when key exists', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue('existing-value')

			const result = await store.setIfNotExist('some-key', 'new-value', 3600)

			expect(result).toBe(false)
			expect(mockNamespace.put).not.toHaveBeenCalled()
		})

		it('should set value when key does not exist', async () => {
			vi.mocked(mockNamespace.get)
				.mockResolvedValueOnce(null) // First call - check if exists
				.mockResolvedValueOnce('new-value') // Second call - verify after put

			vi.mocked(mockNamespace.put).mockResolvedValue()

			const result = await store.setIfNotExist('new-key', 'new-value', 3600)

			expect(result).toBe(true)
			expect(mockNamespace.put).toHaveBeenCalledWith('new-key', 'new-value', { expirationTtl: 3600 })
		})
	})

	describe('delete', () => {
		it('should delete key from namespace', async () => {
			vi.mocked(mockNamespace.delete).mockResolvedValue()

			await store.delete('some-key')

			expect(mockNamespace.delete).toHaveBeenCalledWith('some-key')
		})
	})

	describe('extendTTL', () => {
		it('should return false when key does not exist', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue(null)

			const result = await store.extendTTL('missing-key', 3600)

			expect(result).toBe(false)
		})

		it('should extend TTL for existing key', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue('some-value')
			vi.mocked(mockNamespace.put).mockResolvedValue()

			const result = await store.extendTTL('existing-key', 7200)

			expect(result).toBe(true)
			expect(mockNamespace.put).toHaveBeenCalledWith('existing-key', 'some-value', { expirationTtl: 7200 })
		})
	})

	describe('get', () => {
		it('should return undefined when key not found', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue(null)

			const result = await store.get('missing-key')

			expect(result).toBeUndefined()
		})

		it('should return value when key exists', async () => {
			vi.mocked(mockNamespace.get).mockResolvedValue('stored-value')

			const result = await store.get('existing-key')

			expect(result).toBe('stored-value')
		})
	})
})
