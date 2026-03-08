import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('EventHandlers', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  // ── EventBus ────────────────────────────────────────────────────────────────

  test('Custom EventBus created with correct name', () => {
    template.hasResourceProperties('AWS::Events::EventBus', {
      Name: 'lms-events',
    });
  });

  // ── Event processor Lambdas ─────────────────────────────────────────────────

  test('streakProcessor Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-streak-processor',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      MemorySize: 256,
      Timeout: 30,
    });
  });

  test('badgeProcessor Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-badge-processor',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      MemorySize: 256,
      Timeout: 30,
    });
  });

  test('analyticsProcessor Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-analytics-processor',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      MemorySize: 256,
      Timeout: 30,
    });
  });

  test('streakProcessor has USER_STATISTICS_TABLE env var', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-streak-processor',
      Environment: {
        Variables: Match.objectLike({
          USER_STATISTICS_TABLE: Match.anyValue(),
        }),
      },
    });
  });

  test('analyticsProcessor has all leaderboard table env vars', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-analytics-processor',
      Environment: {
        Variables: Match.objectLike({
          USER_STATISTICS_TABLE:     Match.anyValue(),
          LEADERBOARD_DAILY_TABLE:   Match.anyValue(),
          LEADERBOARD_MONTHLY_TABLE: Match.anyValue(),
          LEADERBOARD_GLOBAL_TABLE:  Match.anyValue(),
        }),
      },
    });
  });

  // ── EventBridge rule ─────────────────────────────────────────────────────────

  test('EventBridge rule created for quiz submitted', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'lms-quiz-submitted-rule',
      EventPattern: Match.objectLike({
        source:      ['lms'],
        'detail-type': ['lms.quiz.submitted'],
      }),
    });
  });

  test('Rule has 3 Lambda targets (streak, badge, analytics)', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'lms-quiz-submitted-rule',
      Targets: Match.arrayWith([
        Match.objectLike({ Id: Match.anyValue() }),
        Match.objectLike({ Id: Match.anyValue() }),
        Match.objectLike({ Id: Match.anyValue() }),
      ]),
    });
  });

  // ── API Gateway leaderboard route ────────────────────────────────────────────

  test('leaderboardFetch Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-leaderboard-fetch',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
    });
  });

  // ── Stack outputs ────────────────────────────────────────────────────────────

  test('EventBusName output exported', () => {
    template.hasOutput('EventBusName', {
      Export: { Name: 'LmsEventBusName' },
    });
  });

  test('EventBusArn output exported', () => {
    template.hasOutput('EventBusArn', {
      Export: { Name: 'LmsEventBusArn' },
    });
  });
});
