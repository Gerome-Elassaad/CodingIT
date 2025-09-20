#!/usr/bin/env node

import chalk from 'chalk';
import { TemplateManager } from './template-manager.js';

/**
 * CLI Test script for @packages/create-codinit-app
 * Tests all lib functionality without UI components
 */

async function testTemplateManager() {
  console.log(chalk.blue('🧪 Testing TemplateManager...'));

  try {
    const templateManager = new TemplateManager(process.cwd());

    // Test loading templates
    console.log(chalk.gray('  Testing template loading...'));
    const templates = await templateManager.loadMainTemplates();
    console.log(chalk.green(`  ✓ Loaded ${Object.keys(templates).length} templates`));

    // Test getting template choices
    console.log(chalk.gray('  Testing template choices...'));
    const choices = await templateManager.getTemplateChoices();
    console.log(chalk.green(`  ✓ Generated ${choices.length} CLI choices`));

    // Display available templates
    console.log(chalk.cyan('\n📋 Available Templates:'));
    choices.forEach(choice => {
      console.log(chalk.gray(`  - ${choice.value}: ${choice.short}`));
    });

    return true;
  } catch (error) {
    console.error(chalk.red('  ❌ TemplateManager test failed:'), error.message);
    return false;
  }
}

async function testCLIUtils() {
  console.log(chalk.blue('\n🧪 Testing CLI utilities...'));

  try {
    const { validateProjectName, validateTemplate } = await import('./utils.js');

    // Test project name validation
    console.log(chalk.gray('  Testing project name validation...'));
    const validName = validateProjectName('my-awesome-project');
    const invalidName = validateProjectName('my project with spaces');

    if (validName === true && typeof invalidName === 'string') {
      console.log(chalk.green('  ✓ Project name validation working'));
    } else {
      throw new Error('Project name validation failed');
    }

    // Test template validation
    console.log(chalk.gray('  Testing template validation...'));
    const validTemplate = validateTemplate('nextjs-developer', ['nextjs-developer', 'code-interpreter-v1']);
    const invalidTemplate = validateTemplate('invalid-template', ['nextjs-developer']);

    if (validTemplate === true && typeof invalidTemplate === 'string') {
      console.log(chalk.green('  ✓ Template validation working'));
    } else {
      throw new Error('Template validation failed');
    }

    return true;
  } catch (error) {
    console.error(chalk.red('  ❌ CLI utilities test failed:'), error.message);
    return false;
  }
}

async function runTests() {
  console.log(chalk.cyan('🚀 Running @packages/create-codinit-app CLI tests\n'));

  const results = [];

  results.push(await testTemplateManager());
  results.push(await testCLIUtils());

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(chalk.cyan(`\n📊 Test Results: ${passed}/${total} passed`));

  if (passed === total) {
    console.log(chalk.green('🎉 All CLI tests passed!'));
    process.exit(0);
  } else {
    console.log(chalk.red('❌ Some CLI tests failed'));
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error(chalk.red('💥 Test runner crashed:'), error);
  process.exit(1);
});