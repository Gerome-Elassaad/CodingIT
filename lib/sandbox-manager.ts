import { Sandbox } from '@e2b/code-interpreter';

class SandboxManager {
  private activeSandbox: Sandbox | null = null;

  setActiveSandbox(sandbox: Sandbox) {
    this.activeSandbox = sandbox;
  }

  getActiveProvider() {
    return this.activeSandbox;
  }

  getSandboxInfo() {
    if (!this.activeSandbox) return null;
    return {
      sandboxId: this.activeSandbox.sandboxId,
      url: this.activeSandbox.getHost ? `https://${this.activeSandbox.getHost(3000)}` : null
    };
  }

  async createSandbox() {
    // This method should be implemented based on your needs
    console.log('[SandboxManager] createSandbox called - should be implemented');
    return null;
  }

  async terminate() {
    if (this.activeSandbox) {
      try {
        await this.activeSandbox.kill();
        this.activeSandbox = null;
      } catch (error) {
        console.error('[SandboxManager] Error terminating sandbox:', error);
      }
    }
  }
}

export const sandboxManager = new SandboxManager();
