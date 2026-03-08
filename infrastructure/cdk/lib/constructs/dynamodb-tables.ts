import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DynamoDBTables extends Construct {
  public readonly usersTable: dynamodb.Table;
  public readonly quizAttemptsTable: dynamodb.Table;
  public readonly userStatisticsTable: dynamodb.Table;
  public readonly leaderboardDailyTable: dynamodb.Table;
  public readonly leaderboardMonthlyTable: dynamodb.Table;
  public readonly leaderboardGlobalTable: dynamodb.Table;
  public readonly bookmarksTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ── Users table ────────────────────────────────────────────────────────
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'lms-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(this.usersTable).add('Environment', 'production');
    cdk.Tags.of(this.usersTable).add('Project', 'LMS');

    // ── Quiz attempts table ────────────────────────────────────────────────
    this.quizAttemptsTable = new dynamodb.Table(this, 'QuizAttemptsTable', {
      tableName: 'lms-quiz-attempts',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'attemptId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.quizAttemptsTable.addGlobalSecondaryIndex({
      indexName: 'QuizIndex',
      partitionKey: { name: 'quizId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'completedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── User statistics table ──────────────────────────────────────────────
    this.userStatisticsTable = new dynamodb.Table(this, 'UserStatisticsTable', {
      tableName: 'lms-user-statistics',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Leaderboard — daily (TTL, destroyed on stack delete) ──────────────
    this.leaderboardDailyTable = new dynamodb.Table(this, 'LeaderboardDailyTable', {
      tableName: 'lms-leaderboard-daily',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Leaderboard — monthly ─────────────────────────────────────────────
    this.leaderboardMonthlyTable = new dynamodb.Table(this, 'LeaderboardMonthlyTable', {
      tableName: 'lms-leaderboard-monthly',
      partitionKey: { name: 'month', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Leaderboard — global ──────────────────────────────────────────────
    this.leaderboardGlobalTable = new dynamodb.Table(this, 'LeaderboardGlobalTable', {
      tableName: 'lms-leaderboard-global',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Bookmarks table ────────────────────────────────────────────────────
    this.bookmarksTable = new dynamodb.Table(this, 'BookmarksTable', {
      tableName: 'lms-bookmarks',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'questionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
