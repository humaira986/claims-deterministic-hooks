import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes test coverage by identifying missing assertions, untested execution paths, branches, and important edge cases.',
  model: 'inherit',
  tools: ['Skill'],
  prompt: TEST_COVERAGE_ANALYZER_PROMPT
};