# Package Detection and Installation Guide

This document explains how to use the XML-based package detection and installation mechanism in the Vercel Sandbox environment.

## Overview

The Vercel Sandbox can automatically detect and install packages from XML tags in AI-generated code responses. This mechanism works alongside the existing file detection system.

## XML Tag Formats

### Individual Package Tags
Use `<package>` tags for individual packages:

```xml
<package>react-router-dom</package>
<package>axios</package>
<package>@heroicons/react</package>
```

### Multiple Packages Tag
Use `<packages>` tag for multiple packages (comma or newline separated):

```xml
<packages>
react-router-dom
axios
@heroicons/react
framer-motion
</packages>
```

Or comma-separated:

```xml
<packages>react-router-dom, axios, @heroicons/react, framer-motion</packages>
```

### Command Execution
Use `<command>` tags to execute shell commands in the sandbox:

```xml
<command>npm run build</command>
<command>npm run test</command>
```

## Complete Example

Here's a complete example of an AI response with files, packages, and commands:

```xml
<explanation>
Creating a React application with routing and API integration.
</explanation>

<packages>
react-router-dom
axios
@heroicons/react
</packages>

<file path="src/App.jsx">
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/solid';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg p-4">
          <HomeIcon className="h-6 w-6" />
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
</file>

<file path="src/pages/HomePage.jsx">
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/api/data')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Home Page</h1>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default HomePage;
</file>

<file path="src/pages/AboutPage.jsx">
import React from 'react';

function AboutPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">About Page</h1>
      <p>This is the about page of our application.</p>
    </div>
  );
}

export default AboutPage;
</file>

<command>npm run dev</command>
</xml>
```

## How It Works

1. **Parsing**: The `parseAIResponse` function in `/app/api/apply-ai-code/route.ts` extracts:
   - Files from `<file>` tags
   - Packages from `<package>` and `<packages>` tags
   - Commands from `<command>` tags

2. **Package Installation**: 
   - Packages are automatically installed using npm
   - Both scoped packages (e.g., `@heroicons/react`) and regular packages are supported
   - The system checks if packages are already installed to avoid redundant installations

3. **File Creation**: Files are created in the sandbox after packages are installed

4. **Command Execution**: Commands are executed in the sandbox environment

## API Endpoints

### `/api/apply-ai-code`
Main endpoint that processes AI responses containing XML tags.

**Request body:**
```json
{
  "response": "<AI response with XML tags>",
  "isEdit": false,
  "packages": [] // Optional array of packages
}
```

### `/api/detect-and-install-packages`
Detects packages from import statements in code files.

**Request body:**
```json
{
  "files": {
    "src/App.jsx": "import React from 'react'...",
    "src/utils.js": "import axios from 'axios'..."
  }
}
```

### `/api/install-packages`
Directly installs packages in the sandbox.

**Request body:**
```json
{
  "packages": ["react-router-dom", "axios", "@heroicons/react"]
}
```

## Features

- **Automatic Package Detection**: Extracts packages from import statements
- **Duplicate Prevention**: Avoids installing already-installed packages
- **Scoped Package Support**: Handles packages like `@heroicons/react`
- **Built-in Module Filtering**: Skips Node.js built-in modules
- **Real-time Feedback**: Provides installation progress updates
- **Error Handling**: Reports failed installations

## Best Practices

1. **Specify packages explicitly** using XML tags when possible
2. **Group related packages** in a single `<packages>` tag
3. **Order matters**: Packages are installed before files are created
4. **Use commands** for post-installation tasks like building or testing

## Integration with Vercel Sandbox

The package detection mechanism integrates seamlessly with the Vercel Sandbox:

1. Packages are installed in the sandbox's working directory
2. The development server is automatically restarted after package installation
3. All npm operations run within the sandbox environment
4. Package.json is automatically updated with new dependencies

## Vercel Sandbox Command Execution Methods

### Using runCommand() (Recommended)
```javascript
// Direct command execution using Vercel Sandbox API
const result = await global.activeSandbox.runCommand({
  cmd: 'npm',
  args: ['install', 'axios']
});
const stdout = await result.stdout();
const stderr = await result.stderr();
console.log(stdout);
```

### Command Execution Options

When using `sandbox.runCommand()`, you can specify:
- `cmd`: The command to execute
- `args`: Array of arguments
- `detached`: Run in background (for long-running processes)
- `stdout`: Stream for capturing stdout
- `stderr`: Stream for capturing stderr
- `cmd`: Command string to execute
- `background`: Run in background (true) or wait for completion (false)
- `envs`: Environment variables as key-value pairs
- `user`: User to run command as (default: "user")
- `cwd`: Working directory
- `on_stdout`: Callback for stdout output
- `on_stderr`: Callback for stderr output
- `timeout`: Command timeout in seconds (default: 60)

### Example: Installing packages with commands.run()
```javascript
// Install multiple packages
const packages = ['react-router-dom', 'axios', '@heroicons/react'];
const result = await global.activeSandbox.commands.run(
  `npm install ${packages.join(' ')}`,
  {
    cwd: '/home/user/app',
    timeout: 120,
    on_stdout: (data) => console.log('npm:', data),
    on_stderr: (data) => console.error('npm error:', data)
  }
);

if (result.exitCode === 0) {
  console.log('Packages installed successfully');
} else {
  console.error('Installation failed:', result.stderr);
}