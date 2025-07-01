import 'server-only';

import { Sandbox } from '@e2b/code-interpreter';

const E2B_API_KEY = process.env.E2B_API_KEY;
if (!E2B_API_KEY) {
  throw new Error('E2B_API_KEY environment variable not found');
}

const sandboxTimeout = 10 * 60 * 1000;

export async function evaluateCode(
  sessionID: string,
  code: string,
) {
  const sandbox = await getSandbox(sessionID);

  // Execute the code in a Jupyter Notebook in the sandbox.
  // https://e2b.dev/docs/code-interpreter/execution
  const execution = await sandbox.runCode(code, {
    // We can also use callbacks to handle streaming stdout, stderr, and results from the sandbox.
    // This is useful if you want to stream the results to client directly.
    // onStdout,
    // onStderr,
    // onResult,
  });

  return {
    results: execution.results,
    stdout: execution.logs.stdout,
    stderr: execution.logs.stderr,
    error: execution.error,
  };
}


async function getSandbox(sessionID: string) {
  const sandboxes = await Sandbox.list();

  const sandboxID = sandboxes.find(sandbox => sandbox.metadata?.sessionID === sessionID)?.sandboxId;

  if (sandboxID) {
    const sandbox = await Sandbox.connect(sandboxID, {
        apiKey: E2B_API_KEY,
      })
    await sandbox.setTimeout(sandboxTimeout);
    return sandbox;
  } else {
    const sandbox = await Sandbox.create({
        apiKey: E2B_API_KEY,
        metadata: {
          sessionID,
        },
        timeoutMs: sandboxTimeout
    });
    return sandbox;
  }
}

export function nonEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}