import { Sandbox } from '@e2b/code-interpreter';

class SandboxManager {
  private activeSandbox: Sandbox | null = null;

  setActiveSandbox(sandbox: Sandbox) {
    this.activeSandbox = sandbox;
  }

  getActiveProvider() {
    return this.activeSandbox;
  }
}

export const sandboxManager = new SandboxManager();
