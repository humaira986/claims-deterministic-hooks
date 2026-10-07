import {
  AgentDefinition,
  query
} from '@anthropic-ai/claude-agent-sdk';

import { mcpServersConfig } from './config/mcp.config';

import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents';

import {
  ReviewReportSchema,
  ReviewReport,
  ReviewReportJSONSchema
} from './types/report-types';

import {
  withRetry,
  withTimeout,
  globalRateLimiter
} from './utils';

export interface OrchestratorOptions {
  timeoutMs?: number;
  estimatedTokens?: number;
}

export class CodeReviewOrchestrator {
  private readonly timeoutMs: number;
  private readonly estimatedTokens: number;

  private readonly agents: Record<string, AgentDefinition> = {
    codeQualityAnalyzer,
    testCoverageAnalyzer,
    refactoringSuggester
  };

  constructor(options: OrchestratorOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 300000;
    this.estimatedTokens = options.estimatedTokens ?? 10000;
  }

  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    if (!owner || !repo || !Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error(
        'Invalid repository owner, repository name, or PR number.'
      );
    }

    const prompt = `
Review GitHub pull request ${owner}/${repo}#${prNumber}.

First fetch the pull request information and changed files using the GitHub MCP server.

Then invoke all three specialized subagents:
1. Code Quality Analyzer
2. Test Coverage Analyzer
3. Refactoring Suggester

Run independent analyses in parallel when possible.

Use the specialized agents to analyze the changed code and aggregate their findings.

Combine the results into one ReviewReport that conforms to the ReviewReportSchema.

Return only the structured review report.
`;

    const result = await withTimeout(
      () =>
        withRetry(
          async () => {
            await globalRateLimiter.acquire(this.estimatedTokens);

            try {
              const messages: unknown[] = [];

              const queryResult = query({
                prompt,
                options: {
                  mcpServers: mcpServersConfig,
                  agents: this.agents,
                  allowedTools: ['Task', 'Skill'],
                  outputFormat: {
                    type: 'json_schema',
                    schema: ReviewReportJSONSchema
                  }
                }
              });

              for await (const message of queryResult) {
                messages.push(message);
              }

              return messages;
            } finally {
              globalRateLimiter.release();
            }
          },
          3,
          1000
        ),
      this.timeoutMs
    );

    const lastMessage = result[result.length - 1];

    const candidate =
      typeof lastMessage === 'object' &&
      lastMessage !== null &&
      'structured_output' in lastMessage
        ? (lastMessage as { structured_output: unknown }).structured_output
        : lastMessage;

    return ReviewReportSchema.parse(candidate);
  }
}