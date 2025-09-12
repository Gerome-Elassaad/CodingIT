import { NextRequest, NextResponse } from 'next/server';
import { SandboxProvider } from '@/lib/sandbox/types';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
}

export async function POST(request: NextRequest) {
  try {
    const { packages } = await request.json();
    
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Packages array is required' 
      }, { status: 400 });
    }
    
    // Get provider from sandbox manager or global state
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    
    if (!provider) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox' 
      }, { status: 400 });
    }
    
    console.log(`[install-packages-v2] Installing: ${packages.join(', ')}`);
    
    const result = await provider.installPackages(packages);
    
    return NextResponse.json({
      success: result.success,
      output: result.stdout,
      error: result.stderr,
      message: result.success ? 'Packages installed successfully' : 'Package installation failed'
    });
    
  } catch (error) {
    console.error('[install-packages-v2] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}