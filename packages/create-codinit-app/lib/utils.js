import chalk from 'chalk';

/**
 * Utility functions for @packages/create-codinit-app
 */

/**
 * Validate project name
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'Project name is required';
  }

  if (!/^[a-z0-9-_]+$/i.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, and underscores';
  }

  if (name.length > 50) {
    return 'Project name must be 50 characters or less';
  }

  return true;
}

/**
 * Validate template ID
 */
export function validateTemplate(templateId, availableTemplates) {
  if (!templateId) {
    return true; // Optional parameter
  }

  if (!availableTemplates.includes(templateId)) {
    return `Invalid template. Available templates: ${availableTemplates.join(', ')}`;
  }

  return true;
}

/**
 * Format success message
 */
export function formatSuccessMessage(projectName, projectPath, template) {
  console.log(chalk.green('\n🎉 Project created successfully!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.gray(`  cd ${projectName}`));
  console.log(chalk.gray('  npm install'));
  console.log(chalk.gray('  npm run dev\n'));

  if (template) {
    console.log(chalk.blue(`📋 Template used: ${template}`));
  }

  console.log(chalk.gray(`📁 Project location: ${projectPath}\n`));
  console.log(chalk.yellow('Happy coding! 🚀'));
}

/**
 * Format error message
 */
export function formatErrorMessage(error) {
  console.error(chalk.red('\n❌ Error occurred:'));
  console.error(chalk.red(error.message || error));
  console.log(chalk.yellow('\nPlease try again or report the issue.\n'));
}

/**
 * Check if directory is empty
 */
export function isDirEmpty(path) {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(path);
    return files.length === 0;
  } catch {
    return true; // Directory doesn't exist, so it's "empty"
  }
}