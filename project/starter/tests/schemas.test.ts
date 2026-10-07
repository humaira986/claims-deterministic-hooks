import { describe, expect, it } from 'vitest';

import {
CodeQualityResultSchema,
TestCoverageResultSchema,
RefactoringSuggestionSchema,
CodeQualityResultJSONSchema,
TestCoverageResultJSONSchema,
RefactoringSuggestionJSONSchema
} from '../src/types/analysis-results';

import {
ReviewReportSchema,
ReviewReportJSONSchema
} from '../src/types/report-types';

describe('Analysis schemas', () => {
it('should validate a valid code quality result', () => {
const result = CodeQualityResultSchema.safeParse({
file: 'src/example.ts',
issues: [
{
line: 10,
severity: 'high',
category: 'security',
description: 'Unsafe input handling',
suggestion: 'Validate input before processing'
}
],
overallScore: 85,
summary: 'Good quality with one security issue'
});


expect(result.success).toBe(true);


});

it('should reject an invalid code quality result', () => {
const result = CodeQualityResultSchema.safeParse({
file: 'src/example.ts',
issues: [],
overallScore: 150,
summary: 'Invalid score'
});


expect(result.success).toBe(false);


});

it('should validate a valid test coverage result', () => {
const result = TestCoverageResultSchema.safeParse({
file: 'src/example.ts',
hasTests: true,
testFiles: ['tests/example.test.ts'],
untestedPaths: [
{
type: 'branch',
location: 'line 25',
priority: 'medium',
reasoning: 'Error branch is not covered',
suggestedTest: 'Add a test for the error condition'
}
],
coverageEstimate: 80,
summary: 'Most paths are covered'
});


expect(result.success).toBe(true);


});

it('should reject an invalid test coverage result', () => {
const result = TestCoverageResultSchema.safeParse({
file: 'src/example.ts',
hasTests: true,
testFiles: [],
untestedPaths: [],
coverageEstimate: 120,
summary: 'Invalid coverage'
});


expect(result.success).toBe(false);


});

it('should validate a valid refactoring suggestion', () => {
const result = RefactoringSuggestionSchema.safeParse({
file: 'src/example.ts',
suggestions: [
{
type: 'extract-function',
location: 'lines 10-20',
impact: 'medium',
description: 'Extract repeated logic',
before: 'Repeated code',
after: 'Reusable function',
benefits: 'Improves maintainability'
}
],
summary: 'One refactoring opportunity found'
});


expect(result.success).toBe(true);


});

it('should reject an invalid refactoring suggestion', () => {
const result = RefactoringSuggestionSchema.safeParse({
file: 'src/example.ts',
suggestions: [
{
type: 'invalid-type',
location: 'line 10',
impact: 'medium',
description: 'Invalid',
before: 'Before',
after: 'After',
benefits: 'Benefits'
}
],
summary: 'Invalid suggestion'
});


expect(result.success).toBe(false);


});
});

describe('ReviewReport schema', () => {
it('should validate a complete review report', () => {
const result = ReviewReportSchema.safeParse({
pullRequest: {
owner: 'test-owner',
repo: 'test-repo',
number: 1
},
fileReviews: [],
summary: {
totalFiles: 0,
overallScore: 90,
criticalIssues: 0,
highPriorityTests: 0,
refactoringOpportunities: 0
},
recommendations: [],
metadata: {
analyzedAt: new Date().toISOString(),
duration: 100,
agentVersions: {
codeQualityAnalyzer: 'test',
testCoverageAnalyzer: 'test',
refactoringSuggester: 'test'
}
}
});


expect(result.success).toBe(true);


});

it('should reject a report with missing required fields', () => {
const result = ReviewReportSchema.safeParse({
pullRequest: {
owner: 'test-owner',
repo: 'test-repo',
number: 1
}
});


expect(result.success).toBe(false);


});

it('should reject a report with an invalid PR number', () => {
const result = ReviewReportSchema.safeParse({
pullRequest: {
owner: 'test-owner',
repo: 'test-repo',
number: 'one'
}
});


expect(result.success).toBe(false);


});
});

describe('JSON schema exports', () => {
it('should export the code quality JSON schema', () => {
expect(CodeQualityResultJSONSchema).toBeDefined();
expect(CodeQualityResultJSONSchema).toHaveProperty('type');
expect(CodeQualityResultJSONSchema).toHaveProperty('properties');
});

it('should export the test coverage JSON schema', () => {
expect(TestCoverageResultJSONSchema).toBeDefined();
expect(TestCoverageResultJSONSchema).toHaveProperty('type');
expect(TestCoverageResultJSONSchema).toHaveProperty('properties');
});

it('should export the refactoring JSON schema', () => {
expect(RefactoringSuggestionJSONSchema).toBeDefined();
expect(RefactoringSuggestionJSONSchema).toHaveProperty('type');
expect(RefactoringSuggestionJSONSchema).toHaveProperty('properties');
});

it('should export the review report JSON schema', () => {
expect(ReviewReportJSONSchema).toBeDefined();
expect(ReviewReportJSONSchema).toHaveProperty('type');
expect(ReviewReportJSONSchema).toHaveProperty('properties');
});

it('should include required properties in the review report JSON schema', () => {
const required = ReviewReportJSONSchema.required as string[];

expect(required).toContain('pullRequest');
expect(required).toContain('fileReviews');
expect(required).toContain('summary');
expect(required).toContain('recommendations');
expect(required).toContain('metadata');


});
});
