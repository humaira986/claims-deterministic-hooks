import { describe, expect, it } from 'vitest';

import { CodeReviewOrchestrator } from '../src/orchestrator';
import { ReviewReportSchema } from '../src/types/report-types';
import {
RateLimiter,
DEFAULT_RATE_LIMITS
} from '../src/utils/rate-limiter';

describe('CodeReviewOrchestrator', () => {
describe('Configuration', () => {
it('should initialize with default options', () => {
const orchestrator = new CodeReviewOrchestrator();
expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
});


it('should accept custom timeout configuration', () => {
  const orchestrator = new CodeReviewOrchestrator({
    timeoutMs: 5000,
    estimatedTokens: 2000
  });
  expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
});
         

});

describe('Input validation', () => {
it('should reject an empty repository owner', async () => {
const orchestrator = new CodeReviewOrchestrator();


  await expect(
    orchestrator.reviewPullRequest('', 'repo', 1)
  ).rejects.toThrow(
    'Invalid repository owner, repository name, or PR number.'
  );
});

it('should reject an empty repository name', async () => {
  const orchestrator = new CodeReviewOrchestrator();

  await expect(
    orchestrator.reviewPullRequest('owner', '', 1)
  ).rejects.toThrow(
    'Invalid repository owner, repository name, or PR number.'
  );
});

it('should reject a zero PR number', async () => {
  const orchestrator = new CodeReviewOrchestrator();

  await expect(
    orchestrator.reviewPullRequest('owner', 'repo', 0)
  ).rejects.toThrow(
    'Invalid repository owner, repository name, or PR number.'
  );
});

it('should reject a negative PR number', async () => {
  const orchestrator = new CodeReviewOrchestrator();

  await expect(
    orchestrator.reviewPullRequest('owner', 'repo', -1)
  ).rejects.toThrow(
    'Invalid repository owner, repository name, or PR number.'
  );


});

describe('ReviewReport schema', () => {
it('should validate a valid review report', () => {
const report = {
pullRequest: {
owner: 'test-owner',
repo: 'test-repo',
number: 1
},
fileReviews: [],
summary: {
totalFiles: 0,
overallScore: 100,
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
};


  const result = ReviewReportSchema.safeParse(report);
  expect(result.success).toBe(true);
});

it('should reject an invalid review report', () => {
  const invalidReport = {
    pullRequest: {
      owner: 'test-owner',
      repo: 'test-repo',
      number: 1
    }
  };

  const result = ReviewReportSchema.safeParse(invalidReport);
  expect(result.success).toBe(false);
});

it('should reject an invalid overall score type', () => {
  const report = {
    pullRequest: {
      owner: 'test-owner',
      repo: 'test-repo',
      number: 1
    },
    fileReviews: [],
    summary: {
      totalFiles: 0,
      overallScore: 'invalid',
      criticalIssues: 0,
      highPriorityTests: 0,
      refactoringOpportunities: 0
    },
    recommendations: [],
    metadata: {
      analyzedAt: new Date().toISOString(),
      duration: 100,
      agentVersions: {}
    }
  };

  const result = ReviewReportSchema.safeParse(report);
  expect(result.success).toBe(false);
});


});

describe('RateLimiter', () => {
it('should use the expected default limits', () => {
expect(DEFAULT_RATE_LIMITS.maxRequestsPerMinute).toBe(50);
expect(DEFAULT_RATE_LIMITS.maxTokensPerMinute).toBe(100000);
expect(DEFAULT_RATE_LIMITS.maxConcurrent).toBe(5);
});

it('should allow a request when limits are available', () => {
  const limiter = new RateLimiter({
    maxRequestsPerMinute: 5,
    maxTokensPerMinute: 10000,
    maxConcurrent: 2
  });

  expect(limiter.canProceed(1000)).toBe(true);
});

it('should report correct status after acquiring a request', async () => {
  const limiter = new RateLimiter({
    maxRequestsPerMinute: 5,
    maxTokensPerMinute: 10000,
    maxConcurrent: 2
  });

  await limiter.acquire(1000);

  const status = limiter.getStatus();

  expect(status.activeRequests).toBe(1);
  expect(status.requestsInWindow).toBe(1);
  expect(status.tokensInWindow).toBe(1000);

  limiter.release();
});

it('should stop requests when the concurrency limit is reached', async () => {
  const limiter = new RateLimiter({
    maxRequestsPerMinute: 5,
    maxTokensPerMinute: 10000,
    maxConcurrent: 1
  });

  await limiter.acquire(1000);

  expect(limiter.canProceed(1000)).toBe(false);

  limiter.release();

  expect(limiter.canProceed(1000)).toBe(true);
});

});
});
});
