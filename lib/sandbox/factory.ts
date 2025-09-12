import { SandboxProvider, SandboxProviderConfig } from './types';
import { E2BProvider } from './providers/e2b-provider';
import { VercelProvider } from './providers/vercel-provider';

export class SandboxFactory {
  static create(provider?: string, config?: SandboxProviderConfig): SandboxProvider {
    // Use environment variable if provider not specified
    const selectedProvider = provider || process.env.SANDBOX_PROVIDER || 'e2b';
    
    
    switch (selectedProvider.toLowerCase()) {
      case 'e2b':
        return new E2BProvider(config || {});
      
      case 'vercel':
        return new VercelProvider(config || {});
      
      default:
        throw new Error(`Unknown sandbox provider: ${selectedProvider}. Supported providers: e2b, vercel`);
    }
  }
  
  static getAvailableProviders(): string[] {
    return ['e2b', 'vercel'];
  }
  
  static isProviderAvailable(provider: string): boolean {
    switch (provider.toLowerCase()) {
      case 'e2b':
        return !!process.env.E2B_API_KEY;
      
      case 'vercel':
        // Vercel can use OIDC (automatic) or PAT
        return !!process.env.VERCEL_OIDC_TOKEN || 
               (!!process.env.VERCEL_TOKEN && !!process.env.VERCEL_TEAM_ID && !!process.env.VERCEL_PROJECT_ID);
      
      default:
        return false;
    }
  }
}