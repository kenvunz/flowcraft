import {
	type ContextImplementation,
	FlowRuntime,
	type Middleware,
	type NodeResult,
} from 'flowcraft'
import { createStaticAnalysisDiagramsWorkflow } from './workflow.js'

class StaticAnalysisMiddleware implements Middleware {
	async aroundNode(
		_ctx: ContextImplementation<Record<string, any>>,
		nodeId: string,
		next: () => Promise<NodeResult>,
	): Promise<NodeResult> {
		console.log(`[ANALYSIS] Analyzing ${nodeId}`)
		try {
			const result = await next()
			console.log(`[ANALYSIS] ${nodeId} analysis completed`)
			return result
		} catch (error: any) {
			console.log(`[ANALYSIS] ${nodeId} analysis failed: ${error.message}`)
			throw error
		}
	}
}

async function main() {
	console.log('🚀 Flowcraft Static Analysis Diagrams Example\n')

	// ============================================================================
	// STATIC ANALYSIS DIAGRAMS WORKFLOW
	// ============================================================================
	console.log('='.repeat(60))
	console.log('📊 STATIC ANALYSIS DIAGRAMS WORKFLOW')
	console.log('='.repeat(60))

	const runtime = new FlowRuntime({
		middleware: [new StaticAnalysisMiddleware()],
	})

	// Create a sample workflow to analyze
	const sampleWorkflow = createStaticAnalysisDiagramsWorkflow()
	const sampleBlueprint = sampleWorkflow.toBlueprint()

	console.log('📋 Sample Workflow for Analysis:')
	console.log(`   ID: ${sampleBlueprint.id}`)
	console.log(`   Nodes: ${sampleBlueprint.nodes.length}`)
	console.log(`   Edges: ${sampleBlueprint.edges.length}`)
	console.log()

	try {
		const workflow = createStaticAnalysisDiagramsWorkflow()
		const result = await runtime.run(
			workflow.toBlueprint(),
			{ workflow: sampleBlueprint },
			{ functionRegistry: workflow.getFunctionRegistry() },
		)

		console.log('\n✅ Static analysis completed successfully!')
		console.log('\n📊 Analysis Results:')
		console.log(`   Status: ${result.status}`)
		console.log(`   Execution ID: ${result.context._executionId}`)

		const diagram = result.context.diagram
		if (diagram) {
			console.log('\n📈 Generated Diagram:')
			console.log(diagram)
		}
	} catch (error) {
		console.error('\n❌ Static analysis failed:', (error as Error).message)
		process.exit(1)
	}

	console.log('\n🎉 Static analysis diagrams example completed!')
}

main().catch((error) => {
	console.error('💥 An error occurred:', error)
	process.exit(1)
})
