const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all packages in the monorepo
config.watchFolders = [workspaceRoot]

// Resolve modules from workspace root node_modules as well
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Stub out optional packages that Metro can't skip via dynamic import comments
const EMPTY_MODULE = path.resolve(__dirname, 'src/stubs/empty.js')
const OPTIONAL_STUBS = ['@opentelemetry/api']

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (OPTIONAL_STUBS.includes(moduleName)) {
    return { type: 'sourceFile', filePath: EMPTY_MODULE }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
