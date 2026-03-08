import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('DynamoDB Tables', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  // ── Users table ────────────────────────────────────────────────────────

  test('Users table created with correct configuration', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-users',
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('Users table has email GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-users',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        },
      ],
    });
  });

  test('Users table has DynamoDB streams enabled', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-users',
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });
  });

  // ── Quiz attempts table ────────────────────────────────────────────────

  test('Quiz attempts table created with composite key', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-quiz-attempts',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'attemptId', KeyType: 'RANGE' },
      ],
    });
  });

  test('Quiz attempts table has QuizIndex GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-quiz-attempts',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'QuizIndex',
          KeySchema: [
            { AttributeName: 'quizId', KeyType: 'HASH' },
            { AttributeName: 'completedAt', KeyType: 'RANGE' },
          ],
        },
      ],
    });
  });

  // ── User statistics table ──────────────────────────────────────────────

  test('User statistics table created', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-user-statistics',
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  // ── Leaderboard tables ─────────────────────────────────────────────────

  test('Daily leaderboard table has TTL attribute', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-leaderboard-daily',
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true,
      },
    });
  });

  test('Monthly leaderboard table has TTL attribute', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-leaderboard-monthly',
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true,
      },
    });
  });

  test('Global leaderboard table has PITR enabled', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-leaderboard-global',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  // ── Bookmarks table ────────────────────────────────────────────────────

  test('Bookmarks table created with composite key', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-bookmarks',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'questionId', KeyType: 'RANGE' },
      ],
    });
  });

  // ── Stack outputs ──────────────────────────────────────────────────────

  test('Users table name output exported', () => {
    template.hasOutput('UsersTableName', {
      Export: { Name: 'LmsUsersTableName' },
    });
  });

  test('Quiz attempts table name output exported', () => {
    template.hasOutput('QuizAttemptsTableName', {
      Export: { Name: 'LmsQuizAttemptsTableName' },
    });
  });

  test('Bookmarks table name output exported', () => {
    template.hasOutput('BookmarksTableName', {
      Export: { Name: 'LmsBookmarksTableName' },
    });
  });

  // ── Table count ────────────────────────────────────────────────────────

  test('Stack has exactly 7 DynamoDB tables', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 7);
  });
});
