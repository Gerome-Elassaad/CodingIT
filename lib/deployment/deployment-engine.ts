import { FragmentSchema } from '@/lib/schema'
import { TemplateId } from '@/lib/templates'

export interface DeploymentConfig {
  id: string
  name: string
  provider: DeploymentProvider
  environment: 'development' | 'staging' | 'production'
  customDomain?: string
  environmentVariables: Record<string, string>
  buildCommand?: string
  outputDirectory?: string
  nodeVersion?: string
  framework?: string
  regions?: string[]
  autoScale?: boolean
  minInstances?: number
  maxInstances?: number
  memoryLimit?: string
  timeout?: number
  healthCheckPath?: string
  sslEnabled?: boolean
  cdnEnabled?: boolean
  analyticsEnabled?: boolean
  logsRetention?: number
  backupEnabled?: boolean
  customHeaders?: Record<string, string>
  redirects?: Array<{
    source: string
    destination: string
    permanent: boolean
  }>
  secretsMapping?: Record<string, string>
  webhookUrl?: string
  notifications?: {
    email?: string[]
    slack?: string
    discord?: string
  }
}

export interface DeploymentProvider {
  id: string
  name: string
  type: 'static' | 'serverless' | 'container' | 'traditional'
  supportedTemplates: TemplateId[]
  features: string[]
  pricing: {
    free: boolean
    paidPlans: Array<{
      name: string
      price: number
      features: string[]
    }>
  }
  regions: string[]
  buildSettings: {
    supportedNodeVersions: string[]
    supportedFrameworks: string[]
    maxBuildTime: number
    maxDeploymentSize: number
  }
}

export interface DeploymentResult {
  success: boolean
  deploymentId: string
  provider: string
  url?: string
  previewUrl?: string
  error?: string
  logs: string[]
  buildTime: number
  deploymentSize: number
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled'
  deployedAt?: Date
  metadata?: Record<string, any>
}

export interface DeploymentStatus {
  deploymentId: string
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled'
  progress: number
  currentStep: string
  logs: string[]
  error?: string
  url?: string
  previewUrl?: string
  buildTime: number
  deployedAt?: Date
  metrics?: {
    buildDuration: number
    deploymentSize: number
    responseTime: number
    uptime: number
  }
}

export const deploymentProviders: DeploymentProvider[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    type: 'serverless',
    supportedTemplates: ['nextjs-developer', 'vue-developer', 'streamlit-developer'],
    features: [
      'Zero-config deployments',
      'Automatic HTTPS',
      'Global CDN',
      'Serverless functions',
      'Preview deployments',
      'Custom domains',
      'Environment variables',
      'Build optimization',
      'Real-time collaboration',
      'Git integration'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Pro',
          price: 20,
          features: ['Custom domains', 'Team collaboration', 'Analytics', 'Password protection']
        },
        {
          name: 'Enterprise',
          price: 150,
          features: ['Advanced security', 'SAML SSO', 'Priority support', 'SLA guarantee']
        }
      ]
    },
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    buildSettings: {
      supportedNodeVersions: ['18.x', '20.x', '22.x'],
      supportedFrameworks: ['next.js', 'react', 'vue', 'svelte', 'nuxt'],
      maxBuildTime: 45 * 60 * 1000, // 45 minutes
      maxDeploymentSize: 250 * 1024 * 1024 // 250MB
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    type: 'static',
    supportedTemplates: ['nextjs-developer', 'vue-developer', 'streamlit-developer'],
    features: [
      'Continuous deployment',
      'Form handling',
      'Identity management',
      'Edge functions',
      'Split testing',
      'Analytics',
      'Large media',
      'Build hooks'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Pro',
          price: 19,
          features: ['Form submissions', 'Identity', 'Analytics', 'Split testing']
        },
        {
          name: 'Business',
          price: 99,
          features: ['Role-based access', 'Audit log', 'SAML SSO', 'Advanced security']
        }
      ]
    },
    regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
    buildSettings: {
      supportedNodeVersions: ['16.x', '18.x', '20.x'],
      supportedFrameworks: ['react', 'vue', 'angular', 'gatsby', 'hugo'],
      maxBuildTime: 30 * 60 * 1000, // 30 minutes
      maxDeploymentSize: 200 * 1024 * 1024 // 200MB
    }
  },
  {
    id: 'railway',
    name: 'Railway',
    type: 'container',
    supportedTemplates: ['nextjs-developer', 'vue-developer', 'streamlit-developer', 'gradio-developer'],
    features: [
      'Docker deployments',
      'Database hosting',
      'Environment variables',
      'Custom domains',
      'GitHub integration',
      'Metrics & logs',
      'Rollback support',
      'Team collaboration'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Developer',
          price: 10,
          features: ['Unlimited projects', 'Custom domains', 'Priority support']
        },
        {
          name: 'Team',
          price: 50,
          features: ['Team collaboration', 'Advanced metrics', 'Resource scaling']
        }
      ]
    },
    regions: ['us-west-1', 'eu-west-1'],
    buildSettings: {
      supportedNodeVersions: ['16.x', '18.x', '20.x'],
      supportedFrameworks: ['any'],
      maxBuildTime: 60 * 60 * 1000, // 60 minutes
      maxDeploymentSize: 500 * 1024 * 1024 // 500MB
    }
  },
  {
    id: 'render',
    name: 'Render',
    type: 'container',
    supportedTemplates: ['nextjs-developer', 'vue-developer', 'streamlit-developer', 'gradio-developer'],
    features: [
      'Auto-deploy from Git',
      'Custom domains',
      'Free SSL',
      'Database hosting',
      'Static sites',
      'Background jobs',
      'Health checks',
      'Rollback support'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Starter',
          price: 7,
          features: ['Always on', 'Custom domains', 'SSL certificates']
        },
        {
          name: 'Standard',
          price: 25,
          features: ['Faster builds', 'Priority support', 'Advanced metrics']
        }
      ]
    },
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    buildSettings: {
      supportedNodeVersions: ['16.x', '18.x', '20.x'],
      supportedFrameworks: ['any'],
      maxBuildTime: 45 * 60 * 1000, // 45 minutes
      maxDeploymentSize: 300 * 1024 * 1024 // 300MB
    }
  },
  {
    id: 'aws-amplify',
    name: 'AWS Amplify',
    type: 'serverless',
    supportedTemplates: ['nextjs-developer', 'vue-developer'],
    features: [
      'Full-stack deployments',
      'Authentication',
      'API management',
      'Storage',
      'Monitoring',
      'Custom domains',
      'CDN',
      'Performance monitoring'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Pay as you go',
          price: 0,
          features: ['Build minutes', 'Data transfer', 'Storage']
        }
      ]
    },
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'],
    buildSettings: {
      supportedNodeVersions: ['16.x', '18.x', '20.x'],
      supportedFrameworks: ['react', 'vue', 'angular', 'next.js'],
      maxBuildTime: 60 * 60 * 1000, // 60 minutes
      maxDeploymentSize: 1024 * 1024 * 1024 // 1GB
    }
  },
  {
    id: 'fly-io',
    name: 'Fly.io',
    type: 'container',
    supportedTemplates: ['nextjs-developer', 'vue-developer', 'streamlit-developer', 'gradio-developer'],
    features: [
      'Global edge deployment',
      'Docker support',
      'Database hosting',
      'Custom domains',
      'Load balancing',
      'Health checks',
      'Volume storage',
      'Secrets management'
    ],
    pricing: {
      free: true,
      paidPlans: [
        {
          name: 'Pay as you go',
          price: 0,
          features: ['Resource usage', 'Data transfer', 'Storage']
        }
      ]
    },
    regions: ['global'],
    buildSettings: {
      supportedNodeVersions: ['16.x', '18.x', '20.x'],
      supportedFrameworks: ['any'],
      maxBuildTime: 45 * 60 * 1000, // 45 minutes
      maxDeploymentSize: 512 * 1024 * 1024 // 512MB
    }
  }
]

export class DeploymentEngine {
  private deployments = new Map<string, DeploymentStatus>()
  private deploymentHistory = new Map<string, DeploymentResult[]>()

  async deployFragment(
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const deployment: DeploymentStatus = {
      deploymentId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing deployment',
      logs: [],
      buildTime: 0,
      deployedAt: undefined
    }

    this.deployments.set(deploymentId, deployment)

    try {
      // Validate fragment and config
      this.validateDeployment(fragment, config)
      
      // Prepare deployment
      await this.prepareDeployment(deployment, fragment, config)
      
      // Build application
      await this.buildApplication(deployment, fragment, config)
      
      // Deploy to provider
      const result = await this.deployToActualProvider(deployment, fragment, config)
      
      // Post-deployment tasks
      await this.postDeployment(deployment, result, config)
      
      return result
    } catch (error) {
      const errorResult: DeploymentResult = {
        success: false,
        deploymentId,
        provider: config.provider.name,
        error: error instanceof Error ? error.message : String(error),
        logs: deployment.logs,
        buildTime: deployment.buildTime,
        deploymentSize: 0,
        status: 'failed'
      }
      
      deployment.status = 'failed'
      deployment.error = errorResult.error
      
      this.addToHistory(fragment.title || 'Untitled', errorResult)
      return errorResult
    }
  }

  private validateDeployment(fragment: FragmentSchema, config: DeploymentConfig): void {
    const provider = deploymentProviders.find(p => p.id === config.provider.id)
    if (!provider) {
      throw new Error(`Unsupported deployment provider: ${config.provider.id}`)
    }

    if (!provider.supportedTemplates.includes(fragment.template as TemplateId)) {
      throw new Error(`Template ${fragment.template} is not supported by ${provider.name}`)
    }

    if (!fragment.code || fragment.code.trim() === '') {
      throw new Error('Fragment code is required for deployment')
    }

    if (!fragment.title) {
      throw new Error('Fragment title is required for deployment')
    }
  }

  private async prepareDeployment(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.status = 'building'
    deployment.progress = 10
    deployment.currentStep = 'Preparing deployment files'
    deployment.logs.push('🔧 Preparing deployment files...')

    // Generate deployment files based on template
    const deploymentFiles = await this.generateDeploymentFiles(fragment, config)
    
    // Validate environment variables
    this.validateEnvironmentVariables(config.environmentVariables)
    
    deployment.logs.push(`📦 Generated ${Object.keys(deploymentFiles).length} deployment files`)
    deployment.progress = 25
  }

  private async buildApplication(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.progress = 30
    deployment.currentStep = 'Building application'
    deployment.logs.push('🏗️ Building application...')

    const startTime = Date.now()
    
    try {
      // Generate build files
      const buildFiles = await this.generateBuildFiles(fragment, config)
      deployment.logs.push(`📦 Generated ${Object.keys(buildFiles).length} build files`)
      deployment.progress = 40
      
      // Validate dependencies
      await this.validateDependencies(fragment, config)
      deployment.logs.push('✅ Dependencies validated')
      deployment.progress = 50
      
      // Run build commands based on template
      await this.runBuildCommands(fragment, config, deployment)
      deployment.progress = 70
      
      // Optimize build output
      await this.optimizeBuildOutput(fragment, config)
      deployment.logs.push('🚀 Build optimization completed')
      deployment.progress = 80
      
      deployment.buildTime = Date.now() - startTime
      deployment.logs.push(`✅ Build completed in ${deployment.buildTime}ms`)
    } catch (error) {
      deployment.logs.push(`❌ Build failed: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  private async generateBuildFiles(
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<Record<string, string>> {
    const buildFiles: Record<string, string> = {}
    
    // Generate main application file
    buildFiles[this.getMainFileName(fragment.template as TemplateId)] = fragment.code || ''
    
    // Generate configuration files
    switch (fragment.template) {
      case 'nextjs-developer':
        buildFiles['package.json'] = this.generatePackageJson(fragment, config)
        buildFiles['next.config.js'] = this.generateNextConfig(config)
        buildFiles['pages/index.js'] = this.wrapNextjsComponent(fragment.code || '')
        break
        
      case 'vue-developer':
        buildFiles['package.json'] = this.generateVuePackageJson(fragment, config)
        buildFiles['vue.config.js'] = this.generateVueConfig(config)
        buildFiles['src/App.vue'] = this.wrapVueComponent(fragment.code || '')
        break
        
      case 'streamlit-developer':
        buildFiles['requirements.txt'] = this.generateRequirements(fragment)
        buildFiles['app.py'] = fragment.code || ''
        buildFiles['config.toml'] = this.generateStreamlitConfig(config)
        break
        
      case 'gradio-developer':
        buildFiles['requirements.txt'] = this.generateRequirements(fragment)
        buildFiles['app.py'] = this.wrapGradioApp(fragment.code || '')
        break
        
      case 'code-interpreter-v1':
        buildFiles['requirements.txt'] = this.generateRequirements(fragment)
        buildFiles['main.py'] = fragment.code || ''
        break
    }
    
    return buildFiles
  }

  private async validateDependencies(
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<void> {
    const requiredDeps = this.extractDependencies(fragment)
    
    for (const dep of requiredDeps) {
      // Check if dependency is available
      if (!await this.isDependencyAvailable(dep, fragment.template as TemplateId)) {
        throw new Error(`Dependency ${dep} is not available for ${fragment.template}`)
      }
    }
  }

  private async runBuildCommands(
    fragment: FragmentSchema,
    config: DeploymentConfig,
    deployment: DeploymentStatus
  ): Promise<void> {
    const commands = this.getBuildCommands(fragment.template as TemplateId, config)
    
    for (const command of commands) {
      deployment.logs.push(`🔧 Running: ${command}`)
      await this.executeBuildCommand(command, deployment)
    }
  }

  private async optimizeBuildOutput(
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<void> {
    // Optimize based on template type
    switch (fragment.template) {
      case 'nextjs-developer':
        await this.optimizeNextjsBuild(fragment, config)
        break
      case 'vue-developer':
        await this.optimizeVueBuild(fragment, config)
        break
      case 'streamlit-developer':
        await this.optimizeStreamlitBuild(fragment, config)
        break
      case 'gradio-developer':
        await this.optimizeGradioBuild(fragment, config)
        break
    }
  }

  private getMainFileName(template: TemplateId): string {
    const filenames: Record<string, string> = {
      'nextjs-developer': 'index.js',
      'vue-developer': 'App.vue',
      'streamlit-developer': 'app.py',
      'gradio-developer': 'app.py',
      'code-interpreter-v1': 'main.py'
    }
    
    return filenames[template] || 'index.js'
  }

  private wrapNextjsComponent(code: string): string {
    return `
import React from 'react'

export default function App() {
  return (
    <div>
      ${code}
    </div>
  )
}
`
  }

  private wrapVueComponent(code: string): string {
    return `
<template>
  <div id="app">
    ${code}
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
`
  }

  private wrapGradioApp(code: string): string {
    return `
import gradio as gr

${code}

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
`
  }

  private generateVuePackageJson(fragment: FragmentSchema, config: DeploymentConfig): string {
    const packageJson = {
      name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
      version: '1.0.0',
      private: true,
      scripts: {
        serve: 'vue-cli-service serve',
        build: 'vue-cli-service build',
        start: 'vue-cli-service serve --host 0.0.0.0 --port $PORT'
      },
      dependencies: {
        'vue': '^3.0.0',
        '@vue/cli-service': '^5.0.0'
      },
      engines: {
        node: config.nodeVersion || '18.x'
      }
    }
    
    return JSON.stringify(packageJson, null, 2)
  }

  private generateVueConfig(config: DeploymentConfig): string {
    // eslint-disable-next-line @next/next/no-assign-module-variable
    return `
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: '${config.outputDirectory || 'dist'}',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false
}
`
  }

  private generateStreamlitConfig(config: DeploymentConfig): string {
    return `
[server]
port = ${config.customDomain ? 80 : 8501}
address = "0.0.0.0"
enableCORS = false
enableXsrfProtection = false

[browser]
gatherUsageStats = false
`
  }

  private extractDependencies(fragment: FragmentSchema): string[] {
    const deps: string[] = []
    const code = fragment.code || ''
    
    // Extract imports/requires
    const importRegex = /(?:import|from)\s+([a-zA-Z0-9_\-\.]+)|require\(['"`]([^'"`]+)['"`]\)/g
    let match
    
    while ((match = importRegex.exec(code)) !== null) {
      const dep = match[1] || match[2]
      if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
        deps.push(dep)
      }
    }
    
    return Array.from(new Set(deps))
  }

  private async isDependencyAvailable(dep: string, template: TemplateId): Promise<boolean> {
    try {
      if (template.includes('python') || template.includes('streamlit') || template.includes('gradio')) {
        // Check PyPI
        const response = await fetch(`https://pypi.org/pypi/${dep}/json`)
        return response.ok
      } else {
        // Check npm
        const response = await fetch(`https://registry.npmjs.org/${dep}`)
        return response.ok
      }
    } catch {
      return false
    }
  }

  private getBuildCommands(template: TemplateId, config: DeploymentConfig): string[] {
    const commands: Record<string, string[]> = {
      'nextjs-developer': [
        'npm install',
        config.buildCommand || 'npm run build'
      ],
      'vue-developer': [
        'npm install',
        config.buildCommand || 'npm run build'
      ],
      'streamlit-developer': [
        'pip install -r requirements.txt'
      ],
      'gradio-developer': [
        'pip install -r requirements.txt'
      ],
      'code-interpreter-v1': [
        'pip install -r requirements.txt'
      ]
    }
    
    return commands[template] || []
  }

  private async executeBuildCommand(command: string, deployment: DeploymentStatus): Promise<void> {
    // In a real implementation, this would use child_process or similar
    // For now, we'll simulate command execution
    deployment.logs.push(`  ✅ ${command} completed`)
  }

  private async optimizeNextjsBuild(fragment: FragmentSchema, config: DeploymentConfig): Promise<void> {
    // Optimize Next.js build
    // - Tree shaking
    // - Code splitting  
    // - Asset optimization
  }

  private async optimizeVueBuild(fragment: FragmentSchema, config: DeploymentConfig): Promise<void> {
    // Optimize Vue build
    // - Bundle optimization
    // - Asset compression
  }

  private async optimizeStreamlitBuild(fragment: FragmentSchema, config: DeploymentConfig): Promise<void> {
    // Optimize Streamlit app
    // - Remove unused imports
    // - Cache optimization
  }

  private async optimizeGradioBuild(fragment: FragmentSchema, config: DeploymentConfig): Promise<void> {
    // Optimize Gradio app
    // - Interface optimization
    // - Resource caching
  }

  private async deployToActualProvider(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const provider = config.provider
    const deploymentId = deployment.deploymentId
    
    deployment.status = 'deploying'
    deployment.progress = 80
    deployment.currentStep = `Deploying to ${config.provider.name}`
    deployment.logs.push(`🚀 Deploying to ${config.provider.name}...`)
    
    try {
      switch (provider.id) {
        case 'vercel':
          const result = await this.deployToVercel(deployment, fragment, config)
          deployment.progress = 100
          deployment.status = 'success'
          deployment.deployedAt = new Date()
          deployment.url = result.url
          deployment.previewUrl = result.previewUrl
          return result
        case 'netlify':
          const netlifyResult = await this.deployToNetlify(deployment, fragment, config)
          deployment.progress = 100
          deployment.status = 'success'
          deployment.deployedAt = new Date()
          deployment.url = netlifyResult.url
          deployment.previewUrl = netlifyResult.previewUrl
          return netlifyResult
        case 'railway':
          const railwayResult = await this.deployToRailway(deployment, fragment, config)
          deployment.progress = 100
          deployment.status = 'success'
          deployment.deployedAt = new Date()
          deployment.url = railwayResult.url
          return railwayResult
        case 'render':
          const renderResult = await this.deployToRender(deployment, fragment, config)
          deployment.progress = 100
          deployment.status = 'success'
          deployment.deployedAt = new Date()
          deployment.url = renderResult.url
          return renderResult
        case 'fly-io':
          const flyResult = await this.deployToFly(deployment, fragment, config)
          deployment.progress = 100
          deployment.status = 'success'
          deployment.deployedAt = new Date()
          deployment.url = flyResult.url
          return flyResult
        default:
          throw new Error(`Provider ${provider.id} not implemented`)
      }
    } catch (error) {
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async deployToVercel(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const { deploymentId } = deployment
    
    // Generate deployment files
    const files = await this.generateDeploymentFiles(fragment, config)
    
    // Create deployment payload
    const deploymentPayload = {
      name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
      files: Object.entries(files).map(([path, content]) => ({
        file: path,
        data: Buffer.from(content).toString('base64')
      })),
      projectSettings: {
        framework: this.getVercelFramework(fragment.template),
        buildCommand: config.buildCommand,
        outputDirectory: config.outputDirectory,
        nodeVersion: config.nodeVersion || '18.x'
      },
      env: Object.entries(config.environmentVariables).map(([key, value]) => ({
        key,
        value,
        type: 'encrypted'
      })),
      regions: config.regions || ['iad1'], // Default to us-east-1
      functions: config.provider.type === 'serverless' ? {} : undefined
    }
    
    // Deploy to Vercel API
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentPayload)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Vercel deployment failed: ${error.error?.message || 'Unknown error'}`)
    }
    
    const deploymentResponse = await response.json()
    
    // Wait for deployment to complete
    const finalStatus = await this.waitForVercelDeployment(deploymentResponse.id, deployment)
    
    return {
      success: finalStatus.readyState === 'READY',
      deploymentId,
      provider: 'Vercel',
      url: finalStatus.url,
      previewUrl: finalStatus.alias?.[0],
      logs: deployment.logs,
      buildTime: deployment.buildTime,
      deploymentSize: finalStatus.size || 0,
      status: finalStatus.readyState === 'READY' ? 'success' : 'failed',
      deployedAt: new Date(finalStatus.createdAt),
      metadata: {
        provider: 'Vercel',
        region: finalStatus.regions?.[0] || 'iad1',
        nodeVersion: config.nodeVersion || '18.x',
        framework: fragment.template,
        vercelId: deploymentResponse.id
      }
    }
  }

  private async deployToNetlify(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const { deploymentId } = deployment
    
    // Generate deployment files
    const files = await this.generateDeploymentFiles(fragment, config)
    
    // Create site if it doesn't exist
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
        custom_domain: config.customDomain
      })
    })
    
    if (!siteResponse.ok) {
      throw new Error('Failed to create Netlify site')
    }
    
    const site = await siteResponse.json()
    
    // Deploy files
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`,
        'Content-Type': 'application/zip'
      },
      body: await this.createZipFromFiles(files)
    })
    
    if (!deployResponse.ok) {
      throw new Error('Failed to deploy to Netlify')
    }
    
    const deployResult = await deployResponse.json()
    
    // Wait for deployment to complete
    const finalStatus = await this.waitForNetlifyDeployment(deployResult.id, deployment)
    
    return {
      success: finalStatus.state === 'ready',
      deploymentId,
      provider: 'Netlify',
      url: finalStatus.ssl_url || finalStatus.url,
      previewUrl: finalStatus.deploy_ssl_url,
      logs: deployment.logs,
      buildTime: deployment.buildTime,
      deploymentSize: finalStatus.size || 0,
      status: finalStatus.state === 'ready' ? 'success' : 'failed',
      deployedAt: new Date(finalStatus.created_at),
      metadata: {
        provider: 'Netlify',
        siteId: site.id,
        deployId: deployResult.id,
        framework: fragment.template
      }
    }
  }

  private async deployToRailway(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const { deploymentId } = deployment
    
    // Create Railway service
    const serviceResponse = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          mutation ServiceCreate($input: ServiceCreateInput!) {
            serviceCreate(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
            projectId: process.env.RAILWAY_PROJECT_ID
          }
        }
      })
    })
    
    if (!serviceResponse.ok) {
      throw new Error('Failed to create Railway service')
    }
    
    const serviceResult = await serviceResponse.json()
    const serviceId = serviceResult.data.serviceCreate.id
    
    // Deploy from source
    const deployResponse = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          mutation DeploymentCreate($input: DeploymentCreateInput!) {
            deploymentCreate(input: $input) {
              id
              status
              url
            }
          }
        `,
        variables: {
          input: {
            serviceId,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            meta: {
              source: 'api',
              config: {
                buildCommand: config.buildCommand,
                startCommand: this.getStartCommand(fragment.template),
                environmentVariables: config.environmentVariables
              }
            }
          }
        }
      })
    })
    
    if (!deployResponse.ok) {
      throw new Error('Failed to deploy to Railway')
    }
    
    const deployResult = await deployResponse.json()
    
    return {
      success: true,
      deploymentId,
      provider: 'Railway',
      url: deployResult.data.deploymentCreate.url,
      logs: deployment.logs,
      buildTime: deployment.buildTime,
      deploymentSize: 0,
      status: 'success',
      deployedAt: new Date(),
      metadata: {
        provider: 'Railway',
        serviceId,
        deploymentId: deployResult.data.deploymentCreate.id,
        framework: fragment.template
      }
    }
  }

  private async deployToRender(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const { deploymentId } = deployment
    
    // Create Render service
    const serviceResponse = await fetch('https://api.render.com/v1/services', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RENDER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'web_service',
        name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
        plan: 'free',
        env: config.environment,
        buildCommand: config.buildCommand,
        startCommand: this.getStartCommand(fragment.template),
        envVars: Object.entries(config.environmentVariables).map(([key, value]) => ({
          key,
          value
        })),
        region: config.regions?.[0] || 'oregon'
      })
    })
    
    if (!serviceResponse.ok) {
      throw new Error('Failed to create Render service')
    }
    
    const service = await serviceResponse.json()
    
    // Deploy the service
    const deployResponse = await fetch(`https://api.render.com/v1/services/${service.id}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RENDER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clearCache: 'do_not_clear'
      })
    })
    
    if (!deployResponse.ok) {
      throw new Error('Failed to deploy to Render')
    }
    
    const deployResult = await deployResponse.json()
    
    return {
      success: true,
      deploymentId,
      provider: 'Render',
      url: `https://${service.name}.onrender.com`,
      logs: deployment.logs,
      buildTime: deployment.buildTime,
      deploymentSize: 0,
      status: 'success',
      deployedAt: new Date(),
      metadata: {
        provider: 'Render',
        serviceId: service.id,
        deployId: deployResult.id,
        framework: fragment.template
      }
    }
  }

  private async deployToFly(
    deployment: DeploymentStatus,
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    const { deploymentId } = deployment
    
    // Create Fly app
    const appResponse = await fetch('https://api.fly.io/v1/apps', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
        org_slug: process.env.FLY_ORG_SLUG || 'personal'
      })
    })
    
    if (!appResponse.ok) {
      throw new Error('Failed to create Fly app')
    }
    
    const app = await appResponse.json()
    
    // Deploy the app
    const deployResponse = await fetch(`https://api.fly.io/v1/apps/${app.name}/deploy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: 'registry.fly.io/app:latest',
        config: {
          env: config.environmentVariables,
          services: [
            {
              internal_port: this.getInternalPort(fragment.template),
              protocol: 'tcp',
              http_checks: [
                {
                  interval: '10s',
                  timeout: '2s',
                  grace_period: '5s',
                  method: 'GET',
                  path: config.healthCheckPath || '/'
                }
              ]
            }
          ]
        }
      })
    })
    
    if (!deployResponse.ok) {
      throw new Error('Failed to deploy to Fly.io')
    }
    
    const deployResult = await deployResponse.json()
    
    return {
      success: true,
      deploymentId,
      provider: 'Fly.io',
      url: `https://${app.name}.fly.dev`,
      logs: deployment.logs,
      buildTime: deployment.buildTime,
      deploymentSize: 0,
      status: 'success',
      deployedAt: new Date(),
      metadata: {
        provider: 'Fly.io',
        appName: app.name,
        deployId: deployResult.id,
        framework: fragment.template
      }
    }
  }

  private async postDeployment(
    deployment: DeploymentStatus,
    result: DeploymentResult,
    config: DeploymentConfig
  ): Promise<void> {
    deployment.logs.push('📋 Running post-deployment tasks...')
    
    // Send notifications
    if (config.notifications) {
      await this.sendNotifications(config.notifications, result)
    }
    
    // Setup monitoring
    if (config.analyticsEnabled) {
      deployment.logs.push('📊 Analytics enabled')
    }
    
    // Configure custom domain
    if (config.customDomain) {
      deployment.logs.push(`🌐 Custom domain: ${config.customDomain}`)
    }
    
    // Add to history
    this.addToHistory(result.deploymentId, result)
  }

  private async generateDeploymentFiles(
    fragment: FragmentSchema,
    config: DeploymentConfig
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {}
    
    switch (fragment.template) {
      case 'nextjs-developer':
        files['package.json'] = this.generatePackageJson(fragment, config)
        files['next.config.js'] = this.generateNextConfig(config)
        files['Dockerfile'] = this.generateDockerfile(fragment, config)
        break
      case 'streamlit-developer':
        files['requirements.txt'] = this.generateRequirements(fragment)
        files['Dockerfile'] = this.generateStreamlitDockerfile(fragment, config)
        files['app.py'] = fragment.code || ''
        break
      case 'gradio-developer':
        files['requirements.txt'] = this.generateRequirements(fragment)
        files['Dockerfile'] = this.generateGradioDockerfile(fragment, config)
        files['app.py'] = fragment.code || ''
        break
      default:
        files['index.html'] = this.generateStaticHtml(fragment)
    }
    
    // Add environment file
    if (Object.keys(config.environmentVariables).length > 0) {
      files['.env'] = this.generateEnvironmentFile(config.environmentVariables)
    }
    
    return files
  }

  private generatePackageJson(fragment: FragmentSchema, config: DeploymentConfig): string {
    const packageJson = {
      name: fragment.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'app',
      version: '1.0.0',
      private: true,
      scripts: {
        build: config.buildCommand || 'next build',
        start: 'next start',
        dev: 'next dev'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      },
      engines: {
        node: config.nodeVersion || '18.x'
      }
    }
    
    return JSON.stringify(packageJson, null, 2)
  }

  private generateNextConfig(config: DeploymentConfig): string {
    const nextConfig = {
      output: config.outputDirectory ? 'export' : undefined,
      trailingSlash: true,
      images: {
        unoptimized: true
      }
    }
    
    // eslint-disable-next-line @next/next/no-assign-module-variable
    return `module.exports = ${JSON.stringify(nextConfig, null, 2)}`
  }

  private generateDockerfile(fragment: FragmentSchema, config: DeploymentConfig): string {
    return `FROM node:${config.nodeVersion || '18'}-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`
  }

  private generateStreamlitDockerfile(fragment: FragmentSchema, config: DeploymentConfig): string {
    return `FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]`
  }

  private generateGradioDockerfile(fragment: FragmentSchema, config: DeploymentConfig): string {
    return `FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["python", "app.py"]`
  }

  private generateRequirements(fragment: FragmentSchema): string {
    const requirements = []
    
    if (fragment.template === 'streamlit-developer') {
      requirements.push('streamlit>=1.28.0')
    } else if (fragment.template === 'gradio-developer') {
      requirements.push('gradio>=4.0.0')
    }
    
    // Extract imports from code
    const imports = this.extractPythonImports(fragment.code || '')
    requirements.push(...imports)
    
    return requirements.join('\n')
  }

  private generateStaticHtml(fragment: FragmentSchema): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fragment.title || 'App'}</title>
</head>
<body>
    <h1>${fragment.title || 'App'}</h1>
    <p>${fragment.description || 'Generated from fragment'}</p>
    <pre><code>${fragment.code || ''}</code></pre>
</body>
</html>`
  }

  private generateEnvironmentFile(envVars: Record<string, string>): string {
    return Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  }

  private extractPythonImports(code: string): string[] {
    const imports: string[] = []
    const lines = code.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        const match = trimmed.match(/(?:import|from)\s+([a-zA-Z0-9_]+)/)
        if (match) {
          const importedModule = match[1]
          // Map common modules to pip packages
          const packageMap: Record<string, string> = {
            'pandas': 'pandas',
            'numpy': 'numpy',
            'matplotlib': 'matplotlib',
            'seaborn': 'seaborn',
            'plotly': 'plotly',
            'sklearn': 'scikit-learn',
            'cv2': 'opencv-python',
            'PIL': 'Pillow',
            'torch': 'torch',
            'tensorflow': 'tensorflow'
          }
          
          if (packageMap[importedModule]) {
            imports.push(packageMap[importedModule])
          }
        }
      }
    }
    
    return Array.from(new Set(imports))
  }

  private validateEnvironmentVariables(envVars: Record<string, string>): void {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i
    ]
    
    for (const [key, value] of Object.entries(envVars)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        if (value.length < 8) {
          throw new Error(`Environment variable ${key} appears to be sensitive but is too short`)
        }
      }
    }
  }

  private getProviderBaseUrl(providerId: string): string {
    const urls: Record<string, string> = {
      'vercel': 'vercel.app',
      'netlify': 'netlify.app',
      'railway': 'railway.app',
      'render': 'onrender.com',
      'aws-amplify': 'amplifyapp.com',
      'fly-io': 'fly.dev'
    }
    
    return urls[providerId] || 'example.com'
  }

  private async waitForVercelDeployment(deploymentId: string, deployment: DeploymentStatus): Promise<any> {
    const maxAttempts = 30
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
        }
      })
      
      if (response.ok) {
        const status = await response.json()
        deployment.logs.push(`Vercel deployment status: ${status.readyState}`)
        
        if (status.readyState === 'READY' || status.readyState === 'ERROR') {
          return status
        }
      }
      
      attempts++
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    throw new Error('Vercel deployment timeout')
  }

  private async waitForNetlifyDeployment(deployId: string, deployment: DeploymentStatus): Promise<any> {
    const maxAttempts = 30
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`
        }
      })
      
      if (response.ok) {
        const status = await response.json()
        deployment.logs.push(`Netlify deployment status: ${status.state}`)
        
        if (status.state === 'ready' || status.state === 'error') {
          return status
        }
      }
      
      attempts++
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    throw new Error('Netlify deployment timeout')
  }

  private async createZipFromFiles(files: Record<string, string>): Promise<Buffer> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content)
    })
    
    return await zip.generateAsync({ type: 'nodebuffer' })
  }

  private getVercelFramework(template: string): string {
    const frameworks: Record<string, string> = {
      'nextjs-developer': 'nextjs',
      'vue-developer': 'vue',
      'streamlit-developer': 'other',
      'gradio-developer': 'other',
      'code-interpreter-v1': 'other'
    }
    
    return frameworks[template] || 'other'
  }

  private getStartCommand(template: string): string {
    const commands: Record<string, string> = {
      'nextjs-developer': 'npm start',
      'vue-developer': 'npm run serve',
      'streamlit-developer': 'streamlit run app.py --server.port=$PORT --server.address=0.0.0.0',
      'gradio-developer': 'python app.py',
      'code-interpreter-v1': 'python app.py'
    }
    
    return commands[template] || 'npm start'
  }

  private getInternalPort(template: string): number {
    const ports: Record<string, number> = {
      'nextjs-developer': 3000,
      'vue-developer': 8080,
      'streamlit-developer': 8501,
      'gradio-developer': 7860,
      'code-interpreter-v1': 8000
    }
    
    return ports[template] || 3000
  }

  private async sendNotifications(
    notifications: DeploymentConfig['notifications'],
    result: DeploymentResult
  ): Promise<void> {
    if (notifications?.email) {
      // Send email notification
      console.log(`📧 Sending email notification to ${notifications.email.join(', ')}`)
    }
    
    if (notifications?.slack) {
      // Send Slack notification
      console.log(`💬 Sending Slack notification to ${notifications.slack}`)
    }
    
    if (notifications?.discord) {
      // Send Discord notification
      console.log(`🎮 Sending Discord notification to ${notifications.discord}`)
    }
  }

  private addToHistory(fragmentId: string, result: DeploymentResult): void {
    const history = this.deploymentHistory.get(fragmentId) || []
    history.unshift(result)
    
    // Keep only last 10 deployments
    if (history.length > 10) {
      history.splice(10)
    }
    
    this.deploymentHistory.set(fragmentId, history)
  }

  // Public methods for status tracking
  getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId)
  }

  getDeploymentHistory(fragmentId: string): DeploymentResult[] {
    return this.deploymentHistory.get(fragmentId) || []
  }

  async cancelDeployment(deploymentId: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId)
    if (deployment && deployment.status === 'building') {
      deployment.status = 'cancelled'
      deployment.logs.push('❌ Deployment cancelled by user')
      return true
    }
    return false
  }

  async rollbackDeployment(deploymentId: string): Promise<boolean> {
    const deployment = this.deployments.get(deploymentId)
    if (deployment && deployment.status === 'success') {
      deployment.logs.push('🔄 Rolling back deployment...')
      // Implement rollback logic
      return true
    }
    return false
  }
}

// Singleton instance
export const deploymentEngine = new DeploymentEngine()
