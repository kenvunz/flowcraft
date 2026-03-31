import { ConsoleLogger, FlowRuntime } from 'flowcraft'
import { createAdvancedContextWorkflow, createBasicContextWorkflow } from './workflow'

async function demonstrateBasicContext() {
	console.log('🔄 BASIC CONTEXT MANAGEMENT')
	console.log('='.repeat(40))

	const workflow = createBasicContextWorkflow()
	const blueprint = workflow.toBlueprint()

	console.log('Workflow demonstrates:')
	console.log('• Reading initial data from context')
	console.log('• Conditional data checking')
	console.log('• Data transformation and updates')
	console.log('• Result accumulation')
	console.log('• Context finalization and cleanup')
	console.log()

	// Test data
	const testData = {
		id: 'user-123',
		name: 'Alice Cooper',
		email: 'alice@example.com',
		department: 'engineering',
	}

	const runtime = new FlowRuntime({ logger: new ConsoleLogger() })

	console.log('Input Data:', JSON.stringify(testData, null, 2))
	console.log()

	try {
		const result = await runtime.run(
			blueprint,
			{ input: testData },
			{ functionRegistry: workflow.getFunctionRegistry() },
		)

		console.log('✅ Basic context workflow completed!')
		console.log()

		// Display key results
		const finalResult = result.context.finalResult
		const cleanOutput = result.context.cleanOutput

		console.log('📊 Final Accumulated Result:')
		console.log(`   ID: ${finalResult.original.id}`)
		console.log(`   Name: ${finalResult.original.name}`)
		console.log(`   Source: ${finalResult.source}`)
		console.log(`   Steps: ${finalResult.steps.join(' → ')}`)
		console.log()

		console.log('🧹 Clean Output:')
		console.log(`   Status: ${cleanOutput.status}`)
		console.log(`   Processed At: ${cleanOutput.processedAt}`)
		console.log(`   Steps Completed: ${cleanOutput.stepsCompleted}`)
	} catch (error) {
		console.error('❌ Basic context workflow failed:', error)
	}
}

async function demonstrateAdvancedContext() {
	console.log('\n🏗️ ADVANCED CONTEXT PATTERNS')
	console.log('='.repeat(40))

	const workflow = createAdvancedContextWorkflow()
	const blueprint = workflow.toBlueprint()

	console.log('Workflow demonstrates:')
	console.log('• Creating nested data structures')
	console.log('• Deep context queries and access')
	console.log('• Complex data organization')
	console.log()

	const runtime = new FlowRuntime({ logger: new ConsoleLogger() })

	try {
		const result = await runtime.run(
			blueprint,
			{}, // No initial data needed
			{ functionRegistry: workflow.getFunctionRegistry() },
		)

		console.log('✅ Advanced context workflow completed!')
		console.log()

		// Display nested structure results
		const nestedData = result.context.nestedData
		const queryResults = result.context.queryResults

		console.log('🏗️ Nested Data Structure:')
		console.log(`   User: ${nestedData.user.profile.basic.name}`)
		console.log(`   Theme: ${nestedData.user.profile.preferences.theme}`)
		console.log(`   Environment: ${nestedData.system.environment}`)
		console.log()

		console.log('🔎 Query Results:')
		console.log(`   User Name: ${queryResults.userName}`)
		console.log(`   Theme: ${queryResults.userTheme}`)
		console.log(`   System Version: ${queryResults.systemVersion}`)
		console.log(`   Paths Accessed: ${queryResults.accessedPaths.length}`)
	} catch (error) {
		console.error('❌ Advanced context workflow failed:', error)
	}
}

async function demonstrateContextPersistence() {
	console.log('\n💾 CONTEXT PERSISTENCE ACROSS EXECUTIONS')
	console.log('='.repeat(50))

	console.log('Flowcraft context persists throughout workflow execution')
	console.log('but is isolated between different workflow runs.')
	console.log()

	// Demonstrate that context doesn't persist between runs
	const workflow = createBasicContextWorkflow()
	const runtime = new FlowRuntime({ logger: new ConsoleLogger() })

	// Run 1
	console.log('▶️ Run 1:')
	const result1 = await runtime.run(
		workflow.toBlueprint(),
		{ input: { id: 'run1', name: 'First Run' } },
		{ functionRegistry: workflow.getFunctionRegistry() },
	)

	// Run 2
	console.log('\n▶️ Run 2:')
	const result2 = await runtime.run(
		workflow.toBlueprint(),
		{ input: { id: 'run2', name: 'Second Run' } },
		{ functionRegistry: workflow.getFunctionRegistry() },
	)

	console.log('\n📊 Comparison:')
	console.log(`   Run 1 ID: ${result1.context.finalResult.original.id}`)
	console.log(`   Run 2 ID: ${result2.context.finalResult.original.id}`)
	console.log('   ✓ Context is properly isolated between executions')
}

async function main() {
	console.log('🚀 Flowcraft Context & State Management Example\n')

	try {
		await demonstrateBasicContext()
		await demonstrateAdvancedContext()
		await demonstrateContextPersistence()

		console.log(`\n${'='.repeat(60)}`)
		console.log('🎓 CONTEXT MANAGEMENT KEY CONCEPTS')
		console.log('='.repeat(60))
		console.log()
		console.log('📖 READING CONTEXT:')
		console.log('   • Use context.get(key) to read values')
		console.log('   • Context persists across all nodes in a workflow')
		console.log('   • Access initial input data via context')
		console.log()
		console.log('✏️  WRITING CONTEXT:')
		console.log('   • Use context.set(key, value) to store data')
		console.log('   • Data is immediately available to subsequent nodes')
		console.log('   • Context acts as workflow state')
		console.log()
		console.log('🔄 DATA FLOW:')
		console.log('   • Nodes read from context, write back to context')
		console.log('   • Enables complex data transformations')
		console.log('   • Supports conditional logic based on context state')
		console.log()
		console.log('🏗️ NESTED STRUCTURES:')
		console.log('   • Context can store complex nested objects')
		console.log('   • Deep access patterns supported')
		console.log('   • Organize data hierarchically')
		console.log()
		console.log('🧹 CLEANUP & FINALIZATION:')
		console.log('   • Context persists until workflow completion')
		console.log('   • Final nodes can clean up intermediate data')
		console.log('   • Create clean output interfaces')
		console.log('='.repeat(60))
	} catch (error) {
		console.error(
			'\n❌ Example failed:',
			error instanceof Error ? error.message : String(error),
		)
		process.exit(1)
	}
}

main()
