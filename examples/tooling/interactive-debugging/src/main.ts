import {
	type ContextImplementation,
	FlowRuntime,
	type Middleware,
	type NodeResult,
} from 'flowcraft'
import { createInteractiveDebuggingWorkflow } from './workflow.js'

class InteractiveDebuggingMiddleware implements Middleware {
	async aroundNode(
		_ctx: ContextImplementation<Record<string, any>>,
		nodeId: string,
		next: () => Promise<NodeResult>,
	): Promise<NodeResult> {
		console.log(`\n🐛 [DEBUG] Entering node: ${nodeId}`)

		// Simulate interactive pause
		console.log(`🐛 [DEBUG] Press Enter to continue...`)
		// In real interactive, would wait for input
		await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate

		try {
			const start = Date.now()
			const result = await next()
			const duration = Date.now() - start

			console.log(`🐛 [DEBUG] Node ${nodeId} completed in ${duration}ms`)
			console.log(`🐛 [DEBUG] Result: ${JSON.stringify(result)}`)

			return result
		} catch (error: any) {
			console.log(`🐛 [DEBUG] Node ${nodeId} threw error: ${error.message}`)
			console.log(`🐛 [DEBUG] Stack trace: ${error.stack?.split('\n')[1] || 'N/A'}`)
			throw error
		}
	}
}

async function main() {
	console.log('🚀 Flowcraft Interactive Debugging Example\n')

	// ============================================================================
	// INTERACTIVE DEBUGGING WORKFLOW
	// ============================================================================
	console.log('='.repeat(60))
	console.log('🐛 INTERACTIVE DEBUGGING WORKFLOW')
	console.log('='.repeat(60))

	const runtime = new FlowRuntime({
		middleware: [new InteractiveDebuggingMiddleware()],
	})

	try {
		const workflow = createInteractiveDebuggingWorkflow()
		const result = await runtime.run(
			workflow.toBlueprint(),
			{},
			{ functionRegistry: workflow.getFunctionRegistry() },
		)

		console.log('\n✅ Interactive debugging completed successfully!')
		console.log('\n📊 Debug Results:')
		console.log(`   Status: ${result.status}`)
		console.log(`   Execution ID: ${result.context._executionId}`)
		console.log(`   Final step count: ${result.context.finalStepCount || 0}`)
	} catch (error) {
		console.error('\n❌ Interactive debugging failed:', (error as Error).message)
		process.exit(1)
	}

	console.log('\n🎉 Interactive debugging example completed!')
}

main().catch((error) => {
	console.error('💥 An error occurred:', error)
	process.exit(1)
})
