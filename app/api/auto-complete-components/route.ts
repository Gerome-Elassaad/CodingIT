import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { missingImports } = await request.json();

    if (!missingImports || !Array.isArray(missingImports) || missingImports.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing imports array is required'
      }, { status: 400 });
    }

    console.log('[auto-complete-components] Auto-generating missing components:', missingImports);

    // Generate simple placeholder components for missing imports
    const generatedComponents = missingImports.map((importPath: string) => {
      // Extract component name from import path
      const componentName = importPath.replace('./', '').replace('../', '').split('/').pop() || 'Component';

      // Generate basic React component
      const content = `import React from 'react';

export default function ${componentName}() {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold">${componentName}</h2>
      <p className="text-gray-600">Auto-generated placeholder component</p>
    </div>
  );
}`;

      return {
        path: `src/components/${componentName}.jsx`,
        content: content,
        description: `Auto-generated placeholder for ${componentName}`
      };
    });

    console.log('[auto-complete-components] Generated', generatedComponents.length, 'components');

    return NextResponse.json({
      success: true,
      components: generatedComponents.map(c => c.path),
      files: generatedComponents.length,
      generatedComponents: generatedComponents
    });
  } catch (error) {
    console.error('[auto-complete-components] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
