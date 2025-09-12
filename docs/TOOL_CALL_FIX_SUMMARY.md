# Tool Call Validation Fix Summary

## Issue
The error message "tool call validation failed: parameters for tool installPackage did not match schema" was occurring when the AI tried to install packages.

## Root Cause
The Groq models (including `moonshotai/kimi-k2-instruct`) do not support function/tool calling. This is a limitation of most Groq models - only specific models like `llama3-groq-70b-8192-tool-use-preview` support tools.

## Solution
Instead of using the Vercel AI SDK's tool calling feature, we switched to XML-based package detection:

### 1. Removed Tool Support
- Removed the `tool` import and `installPackage` tool definition
- Removed the `tools` configuration from the `streamText` call

### 2. Updated System Prompt
Changed from:
```
Use the installPackage tool with parameters: {name: "package-name", reason: "why you need it"}
```

To:
```
You MUST specify packages using <package> tags BEFORE using them in your code. 
For example: <package>three</package> or <package>@heroicons/react</package>
```

### 3. Implemented XML Tag Detection
- Added streaming detection for `<package>` tags during response generation
- Implemented buffering to handle tags split across chunks
- Added support for both individual `<package>` tags and grouped `<packages>` tags

### 4. Real-time Package Detection
Packages are now detected in real-time as the AI generates the response:
```javascript
// Buffer incomplete tags across chunks
const searchText = tagBuffer + text;
const packageRegex = /<package>([^<]+)<\/package>/g;

while ((packageMatch = packageRegex.exec(searchText)) !== null) {
  const packageName = packageMatch[1].trim();
  if (packageName && !packagesToInstall.includes(packageName)) {
    packagesToInstall.push(packageName);
    await sendProgress({ 
      type: 'package', 
      name: packageName,
      message: `📦 Package detected: ${packageName}`
    });
  }
}
```

## Results
- ✅ Package detection now works reliably
- ✅ Real-time UI feedback shows packages as they're detected
- ✅ No more tool validation errors
- ✅ Compatible with all Groq models

## UI Feedback
Users now see:
```
📦 Package detected: three
📦 Package detected: @react-three/fiber
📦 Package detected: @react-three/drei
```

As packages are detected in the AI's response, providing immediate feedback about dependencies that will be installed.