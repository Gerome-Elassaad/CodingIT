# CodingIT API Documentation

## Overview

CodingIT is an AI-powered software engineering platform that provides live code execution, file uploads, real-time chat capabilities, and workflow management. This comprehensive API documentation covers all 27 endpoints across 9 major functional areas.

## Quick Start

### 1. Import Postman Collection
```bash
# Import the collection
curl -o postman-collection.json https://raw.githubusercontent.com/Gerome-Elassaad/CodingIT/main/postman-collection.json

# Import the environment
curl -o postman-environment.json https://raw.githubusercontent.com/Gerome-Elassaad/CodingIT/main/postman-environment.json
```

### 2. Setup Environment Variables
Configure the following essential variables in Postman:

```json
{
  "BASE_URL": "http://localhost:3000",
  "E2B_API_KEY": "your_e2b_api_key",
  "SUPABASE_URL": "your_supabase_url",
  "SUPABASE_ANON_KEY": "your_supabase_anon_key",
  "anthropic_api_key": "your_anthropic_key"
}
```

### 3. Authentication
Most endpoints require Supabase authentication. Use the Bearer token format:
```http
Authorization: Bearer {{supabase_access_token}}
```

## API Endpoints Overview

| Category | Endpoints | Description |
|----------|-----------|-------------|
| 🔐 Authentication | 2 | GitHub OAuth integration |
| 💬 AI Generation | 2 | Code and workflow generation |
| ⚡ Code Execution | 1 | Sandbox code execution |
| 🔧 Sandbox Management | 2 | E2B sandbox operations |
| 📁 File Operations | 5 | File system management |
| 🐛 Debug & Analysis | 2 | Error analysis tools |
| 🚀 Deployments | 5 | Cloud deployment management |
| 🔗 GitHub Integration | 2 | Repository and webhook handling |
| ⚡ Workflows | 6 | Multi-step workflow management |
| 📊 Data & Import | 1 | Dataset import capabilities |
| 🎣 Webhooks | 1 | External webhook processing |

## Detailed Endpoint Documentation

### 🔐 Authentication

#### GitHub OAuth Callback
```http
GET /api/auth/github?code={auth_code}&state={csrf_state}
```

**Description**: Handles GitHub OAuth callback and automatically sets up webhooks for the first 3 repositories.

**Parameters**:
- `code` (required): Authorization code from GitHub
- `state` (required): CSRF protection state parameter
- `error` (optional): Error from GitHub OAuth

**Response**: Redirects to `/settings/integrations` with success or error parameters

**Example**:
```http
GET /api/auth/github?code=abc123&state=xyz789
# Redirects to: /settings/integrations?success=github_connected
```

#### Revoke GitHub Token
```http
POST /api/auth/github/revoke
Content-Type: application/json

{
  "access_token": "github_access_token_here"
}
```

**Description**: Revokes GitHub access token and disconnects the integration.

**Response**:
```json
{
  "success": true
}
```

### 💬 AI Generation

#### Generate Code Fragment
```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer {{supabase_access_token}}

{
  "messages": [
    {
      "role": "user",
      "content": "Create a Python script that analyzes data from a CSV file"
    }
  ],
  "userID": "user_123",
  "teamID": "team_456",
  "template": "code-interpreter-v1",
  "model": "claude-3-sonnet-20240229",
  "config": {
    "model": "claude-3-sonnet-20240229",
    "apiKey": "your_anthropic_key",
    "temperature": 0.7,
    "maxTokens": 4000
  }
}
```

**Description**: Generate AI-powered code fragments using various LLM models with structured output.

**Supported Models**:
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `gpt-4`
- `gpt-3.5-turbo`

**Supported Templates**:
- `code-interpreter-v1` - Python data analysis
- `nextjs-developer` - Next.js applications
- `vue-developer` - Vue.js applications
- `streamlit-developer` - Streamlit dashboards
- `gradio-developer` - Gradio ML interfaces

**Response**: Streaming JSON with fragment schema

#### Generate Workflow
```http
POST /api/chat/workflow
```

**Description**: Generates multi-step workflows with AI detection. The system automatically determines if a request should be a single fragment or broken into multiple workflow steps.

**Key Features**:
- Automatic workflow detection with confidence scoring
- Multi-step fragment breakdown
- Dependency management between steps
- Automatic workflow persistence

### ⚡ Code Execution

#### Execute Code in Sandbox
```http
POST /api/code/execute
Content-Type: application/json

{
  "sessionID": "session_12345",
  "code": "import pandas as pd\ndf = pd.DataFrame({'x': [1,2,3], 'y': [4,5,6]})\nprint(df)"
}
```

**Description**: Execute code in isolated E2B sandboxes with comprehensive result capture.

**Response**:
```json
{
  "results": [...],
  "stdout": ["DataFrame output..."],
  "stderr": [],
  "error": null
}
```

### 🔧 Sandbox Management

#### Create and Run Sandbox
```http
POST /api/sandbox
Content-Type: application/json

{
  "fragment": {
    "commentary": "Creating a data analysis script",
    "template": "code-interpreter-v1",
    "title": "Data Analysis",
    "description": "Analyze CSV data with pandas",
    "additional_dependencies": ["seaborn"],
    "has_additional_dependencies": true,
    "install_dependencies_command": "pip install seaborn",
    "port": null,
    "file_path": "analysis.py",
    "code": "import pandas as pd\nimport matplotlib.pyplot as plt\n# Analysis code here"
  },
  "userID": "user_123",
  "teamID": "team_456"
}
```

**Description**: Creates new E2B sandbox instances, installs dependencies, and executes fragments.

**Execution Flow**:
1. Create sandbox with specified template
2. Install additional dependencies (if any)
3. Write code files to sandbox
4. Execute code and return results

#### Execute Terminal Commands
```http
POST /api/terminal
Content-Type: application/json

{
  "command": "ls -la",
  "sbxId": "sandbox_id_here",
  "workingDirectory": "/home/user",
  "teamID": "team_456"
}
```

**Description**: Execute terminal commands in existing sandbox environments with 30-second timeout.

### 📁 File Operations

#### List Files in Sandbox
```http
GET /api/files?sessionID=session_123&template=code-interpreter-v1
```

**Description**: Returns complete file tree structure for sandbox.

**Response**:
```json
[
  {
    "name": "home",
    "isDirectory": true,
    "children": [
      {
        "name": "user",
        "isDirectory": true,
        "children": [
          {
            "name": "main.py",
            "isDirectory": false,
            "path": "/home/user/main.py"
          }
        ]
      }
    ]
  }
]
```

#### Read File Content
```http
GET /api/files/content?sessionID=session_123&path=/home/user/main.py
```

#### Write File Content
```http
POST /api/files/content
Content-Type: application/json

{
  "sessionID": "session_123",
  "path": "/home/user/new_file.py",
  "content": "print('Hello, World!')\n",
  "template": "code-interpreter-v1"
}
```

#### Existing Sandbox Operations
- `GET/POST /api/files/sandbox` - Connect to existing sandbox by ID
- `GET /api/files/sandbox/list` - List files in connected sandbox

### 🐛 Debug & Analysis

#### Analyze Runtime Errors
```http
POST /api/debug
Content-Type: application/json
Authorization: Bearer {{supabase_access_token}}

{
  "error": "NameError: name 'pandas' is not defined",
  "context": {
    "template": "code-interpreter-v1",
    "line_number": 5
  },
  "code": "import matplotlib.pyplot as plt\ndf = pandas.DataFrame({'x': [1,2,3]})"
}
```

**Description**: AI-powered error analysis with debugging suggestions and severity assessment.

**Response**:
```json
{
  "analysis": "The error occurs because pandas is not imported...",
  "suggestions": [
    "Add 'import pandas as pd' at the top of your script",
    "Use 'pd.DataFrame' instead of 'pandas.DataFrame'"
  ],
  "severity": "medium",
  "category": "import_error"
}
```

#### Get Debug Sessions
```http
GET /api/debug?session_id=debug_123
GET /api/debug  # List all active sessions
```

### 🚀 Deployments

#### Create Deployment
```http
POST /api/deployments
Content-Type: application/json
Authorization: Bearer {{supabase_access_token}}

{
  "fragment": {
    "template": "nextjs-developer",
    "title": "Portfolio Site",
    "code": "export default function Home() { return <h1>Hello</h1> }",
    "port": 3000
  },
  "config": {
    "provider": "vercel",
    "environment": "production",
    "domain": "my-app.vercel.app"
  }
}
```

**Supported Providers**:
- `vercel` - Vercel deployments
- `netlify` - Netlify deployments  
- `aws` - AWS deployments
- `heroku` - Heroku deployments

#### Deployment Management
- `GET /api/deployments` - List deployment history
- `GET /api/deployments/{id}` - Get deployment status
- `DELETE /api/deployments/{id}` - Cancel deployment
- `POST /api/deployments/{id}/rollback` - Rollback deployment

### 🔗 GitHub Integration

#### List User Repositories
```http
GET /api/integrations/github/repos?page=1&per_page=30&sort=updated&type=owner
Authorization: Bearer {{supabase_access_token}}
```

**Parameters**:
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 30)
- `sort` - Sort order: `created`, `updated`, `pushed`, `full_name`
- `type` - Repository type: `all`, `owner`, `member`

#### Get Repository Contents
```http
GET /api/integrations/github/repos/octocat/Hello-World?path=README.md&ref=main
```

**Features**:
- Browse repository files and directories
- Support for different branches/refs
- Automatic token refresh handling
- Rate limit management

### ⚡ Workflows

#### Create Multi-Step Workflow
```http
POST /api/workflows
Content-Type: application/json
Authorization: Bearer {{supabase_access_token}}

{
  "name": "Data Processing Pipeline",
  "description": "Complete data processing with validation and analysis",
  "fragments": [
    {
      "id": "node_1",
      "type": "fragment",
      "position": { "x": 100, "y": 100 },
      "data": {
        "template": "code-interpreter-v1",
        "title": "Data Ingestion",
        "code": "import pandas as pd\ndf = pd.read_csv('data.csv')"
      }
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "source": { "nodeId": "node_1", "portId": "output_1" },
      "target": { "nodeId": "node_2", "portId": "input_1" },
      "dataType": "object"
    }
  ],
  "variables": [
    {
      "name": "input_file",
      "type": "string",
      "default": "data.csv"
    }
  ],
  "triggers": [
    {
      "id": "trigger_1",
      "type": "manual",
      "config": {}
    }
  ]
}
```

#### Execute Workflow
```http
POST /api/workflows/{workflow_id}/execute
Content-Type: application/json

{
  "inputData": {
    "input_file": "sample_data.csv",
    "output_format": "json"
  },
  "triggerType": "manual"
}
```

**Workflow Features**:
- Visual node-based workflow designer
- Fragment dependency management
- Variable passing between steps
- Multiple trigger types (manual, scheduled, webhook)
- Execution tracking and logging

#### Workflow Management
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/{id}` - Get workflow details
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `GET /api/workflows/{id}/execute` - List executions

### 📊 Data & Import

#### Import HuggingFace Datasets
```http
POST /api/import-dataset
Content-Type: application/json

{
  "subset": "python"
}
```

**Description**: Import code datasets from HuggingFace for embeddings and semantic search.

**Supported Subsets**:
- `python` - Python code samples
- `javascript` - JavaScript code samples
- `java` - Java code samples
- `cpp` - C++ code samples

**Process**:
1. Downloads dataset from HuggingFace
2. Processes code into chunks
3. Generates embeddings using Xenova/all-MiniLM-L6-v2
4. Stores in Supabase vector database

### 🎣 Webhooks

#### GitHub Webhook Handler
```http
POST /api/webhooks/github
Content-Type: application/json
X-GitHub-Event: push
X-GitHub-Delivery: 12345-abcdef
X-Hub-Signature-256: sha256=signature_here

{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "user/repo",
    "owner": { "login": "user" }
  },
  "commits": [...],
  "pusher": { "name": "user" }
}
```

**Supported Events**:
- `push` - Repository push events
- `pull_request` - Pull request events
- `issues` - Issue events
- `ping` - Webhook test events

## Error Handling

### Standard Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Missing required parameters, invalid data |
| 401 | Unauthorized | Missing or invalid authentication token |  
| 403 | Forbidden | Insufficient permissions, invalid API key |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side processing error |
| 503 | Service Unavailable | External service unavailable |

### Rate Limiting

Rate limits apply to endpoints without custom API keys:
- **Default**: 10 requests per day
- **With API Key**: No rate limits
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Testing & Examples

### Prerequisites Checklist

- [ ] E2B account and API key
- [ ] Supabase project setup
- [ ] GitHub OAuth app configured (optional)
- [ ] AI provider API keys (Anthropic, OpenAI, etc.)
- [ ] Postman installed

### Sample Test Sequence

1. **Generate a simple Python script**:
   ```http
   POST /api/chat
   # Body: Request Python data analysis script
   ```

2. **Execute the generated code**:
   ```http
   POST /api/code/execute
   # Body: sessionID + generated code
   ```

3. **List created files**:
   ```http
   GET /api/files?sessionID={{session_id}}
   ```

4. **Create a workflow**:
   ```http
   POST /api/workflows
   # Body: Multi-step data processing workflow
   ```

5. **Execute the workflow**:
   ```http
   POST /api/workflows/{{workflow_id}}/execute
   ```

### Common Use Cases

#### 1. AI-Powered Code Generation
Generate code → Execute in sandbox → Iterate based on results

#### 2. Data Analysis Pipeline  
Import data → Process → Analyze → Visualize → Export

#### 3. Web Application Development
Generate Next.js app → Test locally → Deploy to Vercel

#### 4. GitHub Integration
Connect GitHub → Import repository → Analyze code → Generate improvements

#### 5. Workflow Automation
Create workflow → Set triggers → Execute automatically → Monitor results

## Advanced Features

### Custom Templates
The platform supports multiple sandbox templates optimized for different use cases:

- **code-interpreter-v1**: Data science and analysis
- **nextjs-developer**: React/Next.js development
- **vue-developer**: Vue.js development  
- **streamlit-developer**: ML dashboard creation
- **gradio-developer**: ML interface development

### AI Model Support
Multiple AI providers and models are supported:

**Anthropic**:
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

**OpenAI**:
- gpt-4
- gpt-3.5-turbo

**Google**:
- gemini-pro
- gemini-pro-vision

### Webhook Integration
Automatic webhook setup for GitHub repositories enables:
- Real-time code change notifications
- Automated testing and deployment
- Issue and PR tracking
- Integration with external CI/CD systems

## Security & Best Practices

### API Key Management
- Store sensitive keys in environment variables
- Use separate keys for development/production
- Rotate keys regularly
- Never commit keys to version control

### Authentication
- Use Supabase Row Level Security (RLS)
- Implement proper session management
- Validate all user inputs
- Use HTTPS in production

### Sandbox Security
- E2B provides isolated execution environments
- Automatic cleanup after timeout
- Resource limits prevent abuse
- Network isolation for sensitive operations

## Support & Resources

### Documentation Links
- [Postman Collection](./postman-collection.json)
- [OpenAPI Specification](./openapi.yaml)
- [Environment Variables](./postman-environment.json)

### External Resources
- [E2B Documentation](https://e2b.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest)

### Community
- [GitHub Repository](https://github.com/Gerome-Elassaad/CodingIT)
- [Issues & Feature Requests](https://github.com/Gerome-Elassaad/CodingIT/issues)
