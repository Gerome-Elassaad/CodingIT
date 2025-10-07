![CodinIT.dev: AI-Powered Full-Stack Web Development in the Browser](https://github.com/user-attachments/assets/de684e88-a65c-42ea-b067-d1a3bc85a420)

<p align="center">
  <strong>AI-Powered Code Execution and Development Platform</strong>
</p>

<p align="center">
  <a href="https://docs.codinit.dev">Documentation</a> •
  <a href="https://codinit.dev">Website</a> •
  <a href="https://gerome-elassaad.github.io/codinit-app">Desktop App Docs</a> •
  <a href="#features">Features</a> •
  <a href="#get-started">Get Started</a>
</p>

<p align="center">
  <a href="https://e2b.dev/startups">
    <img src="https://img.shields.io/badge/SPONSORED%20BY-E2B%20FOR%20STARTUPS-32CD32?style=for-the-badge" alt="SPONSORED BY E2B.DEV" />
  </a>
</p>

---

## 📦 Workspace Structure

> **This is a pnpm workspace monorepo** containing two applications:

| Application | Location | Framework | Port | Deploy |
|-------------|----------|-----------|------|--------|
| **@codinit/web** | `/` (root) | Next.js 14 | 3000 | Vercel |
| **@codinit/desktop** | `/apps/desktop` | Remix + Electron | 5173 | Desktop installers |

📚 **[WORKSPACE.md](WORKSPACE.md)** - Complete workspace guide (commands, deployment, architecture)

---

## ✨ Features

### Core Capabilities
- 🚀 **AI-Powered Code Generation** - Multiple LLM providers (OpenAI, Anthropic, Google AI, and more)
- ⚡ **Real-time Code Execution** - Secure E2B sandboxes with live preview
- 📊 **Multiple Development Environments** - Python, Next.js, Vue.js, Streamlit, Gradio
- 💬 **Streaming AI Responses** - Real-time UI updates with Vercel AI SDK
- 🔐 **Secure Authentication** - Supabase auth with Row Level Security
- 📦 **Package Installation** - Install any npm or pip package on the fly

### Supported LLM Providers
- 🔸 **OpenAI** (GPT-4, GPT-3.5)
- 🔸 **Anthropic** (Claude models)
- 🔸 **Google AI** (Gemini)
- 🔸 **Groq** (Fast inference)
- 🔸 **Fireworks AI**
- 🔸 **Together AI**
- 🔸 **Mistral AI**
- 🔸 **xAI** (Grok)
- 🔸 **DeepSeek**
- 🔸 **Ollama** (Local models)

### Development Environments
- 🐍 **Python Data Analyst** - Jupyter-style execution with data visualization
- ⚛️ **Next.js Developer** - Full-stack React applications
- 🎨 **Vue.js Developer** - Vue 3 applications
- 📈 **Streamlit Developer** - Data apps and dashboards
- 🎯 **Gradio Developer** - ML model interfaces

### Built With
- **Next.js 14** (App Router, Server Actions)
- **shadcn/ui** + **TailwindCSS** for beautiful UI
- **Vercel AI SDK** for LLM streaming
- **E2B** for secure code execution
- **Supabase** for database and auth
- **TypeScript** for type safety

**⭐ Give us a star if you like this project!**

## Get started

### Prerequisites

- [git](https://git-scm.com)
- Recent version of [Node.js](https://nodejs.org) and npm package manager
- [E2B API Key](https://e2b.dev)
- LLM Provider API Key

### 1. Clone the repository

In your terminal:

```
git clone https://github.com/e2b-dev/fragments.git
```

### 2. Install the dependencies

Enter the repository:

```
cd fragments
```

Run the following to install the required dependencies for both workspaces:

```
pnpm install
```

> **Note:** This project uses **pnpm workspaces**. The command above installs dependencies for both the web app and desktop app.

### 3. Set the environment variables

Create a `.env.local` file and set the following:

```sh
# Get your API key here - https://e2b.dev/
E2B_API_KEY="your-e2b-api-key"

# OpenAI API Key
OPENAI_API_KEY=

# Other providers
ANTHROPIC_API_KEY=
GROQ_API_KEY=
FIREWORKS_API_KEY=
TOGETHER_API_KEY=
GOOGLE_AI_API_KEY=
GOOGLE_VERTEX_CREDENTIALS=
MISTRAL_API_KEY=
XAI_API_KEY=

### Optional env vars

# Domain of the site
NEXT_PUBLIC_SITE_URL=

# Rate limit
RATE_LIMIT_MAX_REQUESTS=
RATE_LIMIT_WINDOW=

# Vercel/Upstash KV (short URLs, rate limiting)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Supabase (auth)
SUPABASE_URL=
SUPABASE_ANON_KEY=

# PostHog (analytics)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

### Disabling functionality (when uncommented)

# Disable API key and base URL input in the chat
# NEXT_PUBLIC_NO_API_KEY_INPUT=
# NEXT_PUBLIC_NO_BASE_URL_INPUT=

# Hide local models from the list of available models
# NEXT_PUBLIC_HIDE_LOCAL_MODELS=
```

### 4. Start the development server

**Web App (Next.js):**
```
pnpm dev
```
Visit http://localhost:3000

**Desktop App (Electron + Remix):**
```
pnpm desktop:dev
```
Or:
```
cd apps/desktop && pnpm dev
```
Visit http://localhost:5173

### 5. Build the applications

**Web App:**
```
pnpm build
```

**Desktop App:**
```
pnpm desktop:build        # Build all platforms
pnpm desktop:build:mac    # macOS only
pnpm desktop:build:win    # Windows only
pnpm desktop:build:linux  # Linux only
```

## Customize

### Adding custom personas

1. Make sure [E2B CLI](https://e2b.dev/docs/cli) is installed and you're logged in.

2. Add a new folder under [sandbox-templates/](sandbox-templates/)

3. Initialize a new template using E2B CLI:

    ```
    e2b template init
    ```

    This will create a new file called `e2b.Dockerfile`.

4. Adjust the `e2b.Dockerfile`

    Here's an example streamlit template:

    ```Dockerfile
    # You can use most Debian-based base images
    FROM python:3.19-slim

    RUN pip3 install --no-cache-dir streamlit pandas numpy matplotlib requests seaborn plotly

    # Copy the code to the container
    WORKDIR /home/user
    COPY . /home/user
    ```

5. Specify a custom start command in `e2b.toml`:

    ```toml
    start_cmd = "cd /home/user && streamlit run app.py"
    ```

6. Deploy the template with the E2B CLI

    ```
    e2b template build --name <template-name>
    ```

    After the build has finished, you should get the following message:

    ```
    ✅ Building sandbox template <template-id> <template-name> finished.
    ```

7. Open [lib/templates.json](lib/templates.json) in your code editor.

    Add your new template to the list. Here's an example for Streamlit:

    ```json
    "streamlit-developer": {
      "name": "Streamlit developer",
      "lib": [
        "streamlit",
        "pandas",
        "numpy",
        "matplotlib",
        "request",
        "seaborn",
        "plotly"
      ],
      "file": "app.py",
      "instructions": "A streamlit app that reloads automatically.",
      "port": 8501 // can be null
    },
    ```

    Provide a template id (as key), name, list of dependencies, entrypoint and a port (optional). You can also add additional instructions that will be given to the LLM.

4. Optionally, add a new logo under [public/thirdparty/templates](public/thirdparty/templates)

### Adding custom LLM models

1. Open [lib/models.json](lib/models.ts) in your code editor.

2. Add a new entry to the models list:

    ```json
    {
      "id": "mistral-large",
      "name": "Mistral Large",
      "provider": "Ollama",
      "providerId": "ollama"
    }
    ```

    Where id is the model id, name is the model name (visible in the UI), provider is the provider name and providerId is the provider tag (see [adding providers](#adding-custom-llm-providers) below).

### Adding custom LLM providers

1. Open [lib/models.ts](lib/models.ts) in your code editor.

2. Add a new entry to the `providerConfigs` list:

    Example for fireworks:

    ```ts
    fireworks: () => createOpenAI({ apiKey: apiKey || process.env.FIREWORKS_API_KEY, baseURL: baseURL || 'https://api.fireworks.ai/inference/v1' })(modelNameString),
    ```

3. Optionally, adjust the default structured output mode in the `getDefaultMode` function:

    ```ts
    if (providerId === 'fireworks') {
      return 'json'
    }
    ```

4. Optionally, add a new logo under [public/thirdparty/logos](public/thirdparty/logos)

## Contributing

As an open-source project, we welcome contributions from the community. If you are experiencing any bugs or want to add some improvements, please feel free to open an issue or pull request.
## 🔧 Customize

### Adding Custom Development Templates

1. Make sure [E2B CLI](https://e2b.dev/docs/cli) is installed and you're logged in.

2. Add a new folder under [sandbox-templates/](sandbox-templates/)

3. Initialize a new template using E2B CLI:

    ```bash
    e2b template init
    ```

    This will create a new file called `e2b.Dockerfile`.

4. **Configure the Dockerfile**

    Example Streamlit template:

    ```dockerfile
    # Use Debian-based base image
    FROM python:3.11-slim

    # Install dependencies
    RUN pip3 install --no-cache-dir streamlit pandas numpy matplotlib requests seaborn plotly

    # Set working directory
    WORKDIR /home/user
    COPY . /home/user
    ```

5. **Set the start command** in `e2b.toml`:

    ```toml
    start_cmd = "cd /home/user && streamlit run app.py --server.port 8501 --server.address 0.0.0.0"
    ```

6. **Deploy the template**

    ```bash
    e2b template build --name <template-name>
    ```

    Success message:
    ```
    ✅ Building sandbox template <template-id> <template-name> finished.
    ```

7. **Register in templates.json**

    Add your template to [`lib/templates.json`](lib/templates.json):

    ```json
    "custom-template": {
      "name": "Custom Template",
      "lib": ["dependency1", "dependency2"],
      "file": "main.py",
      "instructions": "Template-specific instructions for the AI.",
      "port": 8080
    }
    ```

8. **Add template logo** (optional)

    Place logo SVG in [`public/thirdparty/templates/`](public/thirdparty/templates)

### Adding Custom LLM Models

1. **Register the model** in [`lib/models.json`](lib/models.json):

    ```json
    {
      "id": "custom-model-id",
      "name": "Custom Model Name", 
      "provider": "Provider Name",
      "providerId": "provider-id",
      "multiModal": true
    }
    ```

    Parameters:
    - `id`: Unique model identifier
    - `name`: Display name in the UI
    - `provider`: Human-readable provider name
    - `providerId`: Provider configuration key
    - `multiModal`: Whether the model supports images/vision

### Adding Custom LLM Providers

1. **Configure provider** in [`lib/models.ts`](lib/models.ts):

    Add to the `providerConfigs` object:

    ```typescript
    'custom-provider': () => createOpenAI({ 
      apiKey: apiKey || process.env.CUSTOM_PROVIDER_API_KEY, 
      baseURL: baseURL || 'https://api.customprovider.com/v1' 
    })(modelNameString)
    ```

2. **Set output mode** (optional) in `getDefaultMode`:

    ```typescript
    if (providerId === 'custom-provider') {
      return 'json' // or 'tool' or 'object'
    }
    ```

3. **Add environment variable**:

    ```bash
    CUSTOM_PROVIDER_API_KEY="your-api-key"
    ```

4. **Add provider logo** (optional):

    Place SVG logo in [`public/thirdparty/logos/`](public/thirdparty/logos)

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Run linting: `npm run lint`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📜 Apache 2.0 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [E2B](https://e2b.dev) for secure code execution environments
- [Supabase](https://supabase.com) for database and authentication
- [Vercel](https://vercel.com) for deployment and hosting
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- All the amazing AI providers making this possible
