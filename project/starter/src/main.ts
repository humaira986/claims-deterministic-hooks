import * as dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils';
import { formatError, isReviewError } from './utils/error-handler';

dotenv.config();

function validateArguments(
  owner: string | undefined,
  repo: string | undefined,
  prStr: string | undefined
): number {
  if (!owner || !repo || !prStr) {
    throw new Error(
      'Usage: npm run dev -- <owner> <repo> <pr-number>'
    );
  }

  const prNumber = Number(prStr);

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('PR number must be a positive integer.');
  }

  return prNumber;
}

function validateEnvironment(): void {
  const hasAnthropicApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

  const hasAwsCredentials = Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

  if (!hasAnthropicApiKey && !hasAwsCredentials) {
    throw new Error(
      'Authentication is not configured. Set ANTHROPIC_API_KEY or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY.'
    );
  }

  if (hasAwsCredentials && !process.env.AWS_REGION) {
    throw new Error(
      'AWS_REGION is required when using AWS Bedrock authentication.'
    );
  }

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required.');
  }

  if (!process.env.ANTHROPIC_MODEL) {
    throw new Error('ANTHROPIC_MODEL environment variable is required.');
  }

  if (hasAnthropicApiKey) {
    console.log('Using Anthropic API authentication');
  } else {
    console.log('Using AWS Bedrock authentication');
  }

  console.log(`Model: ${process.env.ANTHROPIC_MODEL}`);
}

async function generateReports(
  owner: string,
  repo: string,
  prNumber: number,
  report: Awaited<
    ReturnType<CodeReviewOrchestrator['reviewPullRequest']>
  >
): Promise<void> {
  const reportGenerator = new ReportGenerator();

  await mkdir('reports', { recursive: true });

  const baseName = `${owner}_${repo}_${prNumber}`;

  await writeFile(
    `reports/${baseName}.json`,
    reportGenerator.generateJSONReport(report),
    'utf8'
  );

  await writeFile(
    `reports/${baseName}.md`,
    reportGenerator.generateMarkdownReport(report),
    'utf8'
  );

  await writeFile(
    `reports/${baseName}.html`,
    reportGenerator.generateHTMLReport(report),
    'utf8'
  );

  console.log('');
  console.log('Reports generated:');
  console.log(`  reports/${baseName}.json`);
  console.log(`  reports/${baseName}.md`);
  console.log(`  reports/${baseName}.html`);
}

async function main(): Promise<void> {
  try {
    const [owner, repo, prStr] = process.argv.slice(2);

    const prNumber = validateArguments(owner, repo, prStr);

    validateEnvironment();

    if (!owner || !repo) {
      throw new Error(
        'Repository owner and repository name are required.'
      );
    }

    console.log('');
    console.log(
      `Reviewing ${owner}/${repo}#${prNumber}`
    );

    const orchestrator = new CodeReviewOrchestrator();

    const startTime = Date.now();

    const report = await orchestrator.reviewPullRequest(
      owner,
      repo,
      prNumber
    );

    const duration = Date.now() - startTime;

    const completedReport = {
      ...report,
      metadata: {
        ...report.metadata,
        analyzedAt:
          report.metadata.analyzedAt ||
          new Date().toISOString(),
        duration
      }
    };

    await generateReports(
      owner,
      repo,
      prNumber,
      completedReport
    );

    console.log('');
    console.log('Code review completed successfully.');
  } catch (error) {
    console.error('');

    if (isReviewError(error)) {
      console.error(
        `Review failed: ${formatError(error)}`
      );
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${String(error)}`);
    }

    process.exitCode = 1;
  }
}

void main();