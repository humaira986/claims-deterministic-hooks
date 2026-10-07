import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Identifies refactoring opportunities, design-pattern improvements, code simplification, and modernization opportunities.',
  model: 'inherit',
  tools: ['Skill'],
  prompt: REFACTORING_SUGGESTER_PROMPT
};