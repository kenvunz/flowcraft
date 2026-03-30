import type { WorkflowResult } from '../types'
import type { FlowRuntime } from './runtime'

export interface AwaitingWorkflow {
	executionId: string
	blueprintId: string
	serializedContext: string
	awaitingNodeId: string
	wakeUpAt: string
	functionRegistry?: Map<string, any>
}

export class WorkflowScheduler {
	private runtime: FlowRuntime<any, any>
	private activeWorkflows: Map<string, AwaitingWorkflow> = new Map()
	private resumeResults: Map<string, WorkflowResult> = new Map()
	private intervalId?: NodeJS.Timeout
	private checkIntervalMs: number

	constructor(runtime: FlowRuntime<any, any>, checkIntervalMs: number = 1000) {
		this.runtime = runtime
		this.checkIntervalMs = checkIntervalMs
	}

	start(): void {
		if (this.intervalId) return

		this.intervalId = setInterval(() => {
			this.checkAndResumeWorkflows()
		}, this.checkIntervalMs)
	}

	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = undefined
		}
	}

	registerAwaitingWorkflow(
		executionId: string,
		blueprintId: string,
		serializedContext: string,
		awaitingNodeId: string,
		wakeUpAt: string,
		functionRegistry?: Map<string, any>,
	): void {
		this.activeWorkflows.set(executionId, {
			executionId,
			blueprintId,
			serializedContext,
			awaitingNodeId,
			wakeUpAt,
			functionRegistry,
		})
	}

	unregisterWorkflow(executionId: string): void {
		this.activeWorkflows.delete(executionId)
	}

	private async checkAndResumeWorkflows(): Promise<void> {
		const now = new Date()
		const toResume: AwaitingWorkflow[] = []

		for (const [_executionId, workflow] of this.activeWorkflows) {
			const wakeUpTime = new Date(workflow.wakeUpAt)
			if (wakeUpTime <= now) {
				toResume.push(workflow)
			}
		}

		for (const workflow of toResume) {
			try {
				const blueprint = this.runtime.getBlueprint(workflow.blueprintId)
				if (!blueprint) {
					console.warn(`Blueprint ${workflow.blueprintId} not found, skipping resumption`)
					continue
				}

				const result = await this.runtime.resume(
					blueprint,
					workflow.serializedContext,
					{ output: undefined },
					workflow.awaitingNodeId,
					{ functionRegistry: workflow.functionRegistry },
				)

				this.resumeResults.set(workflow.executionId, result)

				if (result.status === 'completed' || result.status === 'failed') {
					this.unregisterWorkflow(workflow.executionId)
				}
			} catch (error) {
				console.error(`Failed to resume workflow ${workflow.executionId}:`, error)
				this.unregisterWorkflow(workflow.executionId)
			}
		}
	}

	getActiveWorkflows(): AwaitingWorkflow[] {
		return Array.from(this.activeWorkflows.values())
	}

	getResumeResult(executionId: string): WorkflowResult | undefined {
		return this.resumeResults.get(executionId)
	}
}
