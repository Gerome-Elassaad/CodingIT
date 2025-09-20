import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Template Manager for @packages/create-codinit-app
 * Integrates with the main templates system from lib/templates.json
 */
export class TemplateManager {
  constructor(templatesPath) {
    this.templatesPath = templatesPath;
    this.mainTemplatesPath = path.resolve(templatesPath, '../../../lib/templates.json');
  }

  /**
   * Load templates from the main system
   */
  async loadMainTemplates() {
    try {
      if (await fs.pathExists(this.mainTemplatesPath)) {
        const templatesContent = await fs.readFile(this.mainTemplatesPath, 'utf8');
        return JSON.parse(templatesContent);
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not load main templates, using fallback'));
    }
    return this.getFallbackTemplates();
  }

  /**
   * Get fallback templates if main templates are not available
   */
  getFallbackTemplates() {
    return {
      'nextjs-developer': {
        name: 'Next.js developer',
        lib: ['nextjs@14.2.5', 'typescript', '@types/node', '@types/react', '@types/react-dom', 'postcss', 'tailwindcss'],
        file: 'pages/index.tsx',
        instructions: 'A Next.js 14+ app that reloads automatically. Using the pages router.',
        port: 3000,
        language: 'typescript',
        supportsFileEditing: true
      },
      'code-interpreter-v1': {
        name: 'Python data analyst',
        lib: ['python', 'jupyter', 'numpy', 'pandas', 'matplotlib', 'seaborn', 'plotly'],
        file: 'script.py',
        instructions: 'Runs code as a Jupyter notebook cell. Strong data analysis angle.',
        port: null,
        language: 'python',
        supportsFileEditing: true
      }
    };
  }

  /**
   * Get available template choices for CLI prompts
   */
  async getTemplateChoices() {
    const templates = await this.loadMainTemplates();
    return Object.entries(templates).map(([id, template]) => ({
      name: `${template.name} - ${template.instructions}`,
      value: id,
      short: template.name
    }));
  }

  /**
   * Generate project files based on template
   */
  async generateFromTemplate(templateId, projectPath, projectName) {
    const templates = await this.loadMainTemplates();
    const template = templates[templateId];

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    console.log(chalk.blue(`📝 Generating ${template.name} project...`));

    // Create project structure based on template
    if (template.fileStructure) {
      for (const [filePath, content] of Object.entries(template.fileStructure)) {
        const fullPath = path.join(projectPath, filePath);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.ensureDir(dir);

        // Replace project name placeholders
        const processedContent = content.replace(/nextjs-app/g, projectName);

        // Write file
        await fs.writeFile(fullPath, processedContent);
        console.log(chalk.gray(`  ✓ Created ${filePath}`));
      }
    }

    // Create package.json with proper dependencies
    await this.createPackageJson(projectPath, projectName, template);

    // Create README
    await this.createReadme(projectPath, projectName, template);

    return template;
  }

  /**
   * Create package.json based on template
   */
  async createPackageJson(projectPath, projectName, template) {
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: template.language === 'python' ? 'python script.py' : 'next dev',
        build: template.language === 'python' ? 'echo "No build needed"' : 'next build',
        start: template.language === 'python' ? 'python script.py' : 'next start',
        lint: template.language === 'typescript' ? 'next lint' : 'echo "No linting configured"'
      },
      dependencies: {},
      devDependencies: {}
    };

    // Add dependencies based on template lib
    if (template.lib) {
      for (const lib of template.lib) {
        // Skip CLI packages and core dependencies that are handled separately
        if (lib.includes('nextjs') || lib.includes('typescript') || lib.includes('@types/')) {
          continue;
        }

        if (lib.includes('@')) {
          packageJson.dependencies[lib] = 'latest';
        } else {
          packageJson.dependencies[lib] = 'latest';
        }
      }
    }

    // Add common dependencies for Next.js projects
    if (template.language === 'typescript') {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        'react': '^18.3.1',
        'react-dom': '^18.3.1',
        'next': '14.2.5'
      };
      packageJson.devDependencies = {
        'typescript': '^5.5.3',
        '@types/node': '^20.14.0',
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.0'
      };
    }

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log(chalk.gray('  ✓ Created package.json'));
  }

  /**
   * Create README.md
   */
  async createReadme(projectPath, projectName, template) {
    const readme = `# ${projectName}

Generated with @packages/create-codinit-app using the **${template.name}** template.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Template Info

- **Language**: ${template.language}
- **Port**: ${template.port || 'N/A'}
- **Template ID**: ${template.name}

## Features

${template.instructions}

## Generated with CodinIT

This project was created using CodinIT's template system. The template includes:

${template.lib ? template.lib.map(lib => `- ${lib}`).join('\n') : '- Basic setup'}

## Learn More

- [CodinIT Documentation](https://docs.codinit.dev)
- [E2B Sandboxes](https://e2b.dev)
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
    console.log(chalk.gray('  ✓ Created README.md'));
  }
}

export default TemplateManager;