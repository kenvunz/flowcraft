import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/**/*.ts'],
	entryPoints: ['src/index.ts', 'src/testing/index.ts'],
	format: ['esm', 'cjs'],
	target: 'esnext',
	dts: true,
	clean: true,
	sourcemap: true,
	splitting: false,
	treeshake: true,
	minify: false,
})
