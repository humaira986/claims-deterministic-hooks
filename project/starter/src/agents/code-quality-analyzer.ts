import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes code quality with a focus on security vulnerabilities, performance issues, maintainability, and best practices.',
  model: 'inherit',
  tools: ['Skill'],
  prompt: CODE_QUALITY_ANALYZER_PROMPT
};