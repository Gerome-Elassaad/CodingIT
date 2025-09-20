import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
}

export async function POST() {
  try {

    // Get the active sandbox provider
    let provider = sandboxManager.getActiveProvider();

    if (!provider) {
      provider = global.activeSandboxProvider;
    }

    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox'
      }, { status: 404 });
    }

    console.log('[restart-vite] Restarting Vite development server...');

    try {
      // Kill existing Vite processes
      await provider.commands.run('pkill -f vite || true');

      // Wait a moment for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start Vite again
      await provider.commands.run('nohup npm run dev > /tmp/vite.log 2>&1 &');

      // Wait for Vite to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('[restart-vite] Vite server restarted successfully');

      return NextResponse.json({
        success: true,
        message: 'Vite development server restarted successfully'
      });

    } catch (error) {
      console.error('[restart-vite] Error restarting Vite:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to restart Vite: ${(error as Error).message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[restart-vite] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}