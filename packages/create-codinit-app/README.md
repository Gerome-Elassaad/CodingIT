# create-codinit-app

[![npm version](https://badge.fury.io/js/create-codinit-app.svg)](https://badge.fury.io/js/create-codinit-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI tool to bootstrap CodinIT projects with pre-configured templates and sandbox providers.

## Quick Start

```bash
# Using npm
npx create-codinit-app my-project

# Using pnpm
pnpm create codinit-app my-project

# Using yarn
yarn create codinit-app my-project
```

## Features

- 🚀 **Multiple Templates**: Next.js, Python, Vue.js, Streamlit, Gradio
- 🏗️ **Sandbox Integration**: E2B and Vercel sandbox support
- 📦 **Zero Configuration**: Works out of the box
- 🎯 **Interactive CLI**: Guided project setup
- ⚡ **Fast Setup**: Get started in seconds

## Usage

### Interactive Mode

```bash
npx create-codinit-app
```

The CLI will prompt you for:
- Project name
- Template selection
- Sandbox provider
- Environment configuration

### Command Line Options

```bash
npx create-codinit-app [project-name] [options]
```

**Options:**

- `-t, --template <template>` - Template to use (nextjs-developer, code-interpreter-v1, etc.)
- `-s, --sandbox <provider>` - Sandbox provider (e2b or vercel)
- `-p, --path <path>` - Installation path (defaults to current directory)
- `--skip-install` - Skip npm install
- `--dry-run` - Preview actions without creating files

### Examples

```bash
# Create a Next.js project with E2B sandbox
npx create-codinit-app my-app -t nextjs-developer -s e2b

# Create a Python data analysis project
npx create-codinit-app data-project -t code-interpreter-v1 -s e2b

# Dry run to preview actions
npx create-codinit-app my-app --dry-run
```

## Available Templates

| Template | Description | Language | Port |
|----------|-------------|----------|------|
| `nextjs-developer` | Next.js 14+ with TypeScript and Tailwind | TypeScript | 3000 |
| `code-interpreter-v1` | Python data analysis with Jupyter | Python | - |
| `vue-developer` | Vue.js 3 with Nuxt 3 | Vue | 3000 |
| `streamlit-developer` | Streamlit data apps | Python | 8501 |
| `gradio-developer` | Gradio ML interfaces | Python | 7860 |

## Sandbox Providers

### E2B
- Full-featured development sandboxes
- Support for multiple languages
- Integrated development environment

### Vercel
- Serverless deployment platform
- Optimized for frontend frameworks
- Built-in CI/CD

## Development

```bash
# Clone the repository
git clone https://github.com/codinit-dev/codinit
cd codinit/packages/create-codinit-app

# Install dependencies
npm install

# Run tests
npm run test:full

# Test CLI locally
node index.js --dry-run
```

## Project Structure

```
create-codinit-app/
├── index.js              # Main CLI entry point
├── lib/
│   ├── installer.js       # Project installation logic
│   ├── prompts.js         # Interactive prompts
│   ├── template-manager.js # Template handling
│   ├── utils.js           # Utility functions
│   └── cli-test.js        # Test suite
├── templates/
│   └── e2b/               # Sandbox-specific templates
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT © [CodinIT Team](https://codinit.dev)

## Support

- 📖 [Documentation](https://docs.codinit.dev)
- 🐛 [Report Issues](https://github.com/codinit-dev/codinit/issues)
- 💬 [Discord Community](https://discord.gg/codinit)

---

Made with ❤️ by the CodinIT team