import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox-manager';

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

    console.log('[install-packages] Installing packages:', packages);

    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send progress updates
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start package installation in background
    (async () => {
      const results = {
        installed: [] as string[],
        failed: [] as string[],
        alreadyInstalled: [] as string[]
      };

      try {
        await sendProgress({
          type: 'start',
          message: `Installing ${packages.length} packages...`,
          packages
        });

        // Check which packages are already installed
        for (const packageName of packages) {
          try {
            const checkResult = await provider.commands.run(`test -d node_modules/${packageName}`);

            if (checkResult.exitCode === 0) {
              results.alreadyInstalled.push(packageName);
              await sendProgress({
                type: 'package-status',
                package: packageName,
                status: 'already-installed'
              });
            }
          } catch (error) {
            // Package not installed, will install later
          }
        }

        // Install missing packages
        const toInstall = packages.filter(pkg => !results.alreadyInstalled.includes(pkg));

        if (toInstall.length > 0) {
          await sendProgress({
            type: 'installing',
            message: `Installing ${toInstall.length} new packages...`,
            packages: toInstall
          });

          try {
            const installResult = await provider.commands.run(`npm install --save ${toInstall.join(' ')}`);

            if (installResult.exitCode === 0) {
              // Verify installation
              for (const packageName of toInstall) {
                try {
                  const verifyResult = await provider.commands.run(`test -d node_modules/${packageName}`);

                  if (verifyResult.exitCode === 0) {
                    results.installed.push(packageName);
                    await sendProgress({
                      type: 'package-installed',
                      package: packageName,
                      status: 'success'
                    });
                  } else {
                    results.failed.push(packageName);
                    await sendProgress({
                      type: 'package-failed',
                      package: packageName,
                      status: 'failed',
                      error: 'Installation verification failed'
                    });
                  }
                } catch (error) {
                  results.failed.push(packageName);
                  await sendProgress({
                    type: 'package-failed',
                    package: packageName,
                    status: 'failed',
                    error: (error as Error).message
                  });
                }
              }
            } else {
              // Installation command failed
              for (const packageName of toInstall) {
                results.failed.push(packageName);
                await sendProgress({
                  type: 'package-failed',
                  package: packageName,
                  status: 'failed',
                  error: 'npm install command failed'
                });
              }
            }
          } catch (error) {
            console.error('[install-packages] Installation error:', error);
            for (const packageName of toInstall) {
              results.failed.push(packageName);
              await sendProgress({
                type: 'package-failed',
                package: packageName,
                status: 'failed',
                error: (error as Error).message
              });
            }
          }
        }

        // Send final results
        await sendProgress({
          type: 'success',
          installedPackages: results.installed,
          failedPackages: results.failed,
          alreadyInstalledPackages: results.alreadyInstalled,
          message: `Installation complete. ${results.installed.length} installed, ${results.failed.length} failed, ${results.alreadyInstalled.length} already installed.`
        });

      } catch (error) {
        await sendProgress({
          type: 'error',
          error: (error as Error).message
        });
      } finally {
        await writer.close();
      }
    })();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[install-packages] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}