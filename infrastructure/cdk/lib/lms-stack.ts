import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBTables } from './constructs/dynamodb-tables';
import { S3Buckets } from './constructs/s3-buckets';
import { CloudFrontDistribution } from './constructs/cloudfront-distribution';
import { CognitoAuth } from './constructs/cognito-auth';
import { ApiGatewayConstruct } from './constructs/api-gateway';
import { EventHandlersConstruct } from './constructs/event-handlers';

export class LmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tables = new DynamoDBTables(this, 'DynamoDBTables');
    const buckets = new S3Buckets(this, 'S3Buckets');
    const cdn = new CloudFrontDistribution(this, 'CloudFront', {
      quizContentBucket: buckets.quizContentBucket,
      learningContentBucket: buckets.learningContentBucket,
    });
    const auth = new CognitoAuth(this, 'CognitoAuth');

    const eventHandlers = new EventHandlersConstruct(this, 'EventHandlers', {
      userStatisticsTable:     tables.userStatisticsTable,
      leaderboardDailyTable:   tables.leaderboardDailyTable,
      leaderboardMonthlyTable: tables.leaderboardMonthlyTable,
      leaderboardGlobalTable:  tables.leaderboardGlobalTable,
    });

    const apiGw = new ApiGatewayConstruct(this, 'ApiGateway', {
      userPool:               auth.userPool,
      quizAttemptsTable:      tables.quizAttemptsTable,
      userStatisticsTable:    tables.userStatisticsTable,
      leaderboardDailyTable:  tables.leaderboardDailyTable,
      leaderboardMonthlyTable: tables.leaderboardMonthlyTable,
      leaderboardGlobalTable: tables.leaderboardGlobalTable,
      eventBusArn:            eventHandlers.eventBus.eventBusArn,
    });

    // ── DynamoDB outputs ──────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: tables.usersTable.tableName,
      exportName: 'LmsUsersTableName',
    });
    new cdk.CfnOutput(this, 'QuizAttemptsTableName', {
      value: tables.quizAttemptsTable.tableName,
      exportName: 'LmsQuizAttemptsTableName',
    });
    new cdk.CfnOutput(this, 'UserStatisticsTableName', {
      value: tables.userStatisticsTable.tableName,
      exportName: 'LmsUserStatisticsTableName',
    });
    new cdk.CfnOutput(this, 'BookmarksTableName', {
      value: tables.bookmarksTable.tableName,
      exportName: 'LmsBookmarksTableName',
    });

    // ── S3 outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'QuizContentBucketName', {
      value: buckets.quizContentBucket.bucketName,
      exportName: 'LmsQuizContentBucketName',
    });
    new cdk.CfnOutput(this, 'QuizResultsBucketName', {
      value: buckets.quizResultsBucket.bucketName,
      exportName: 'LmsQuizResultsBucketName',
    });
    new cdk.CfnOutput(this, 'LearningContentBucketName', {
      value: buckets.learningContentBucket.bucketName,
      exportName: 'LmsLearningContentBucketName',
    });

    // ── CloudFront outputs ────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: cdn.distribution.distributionDomainName,
      exportName: 'LmsCloudFrontDomainName',
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: cdn.distribution.distributionId,
      exportName: 'LmsCloudFrontDistributionId',
    });

    // ── Cognito outputs ───────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: auth.userPool.userPoolId,
      exportName: 'LmsUserPoolId',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: auth.userPoolClient.userPoolClientId,
      exportName: 'LmsUserPoolClientId',
    });

    // ── API Gateway outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiGw.api.url,
      exportName: 'LmsApiUrl',
    });

    // ── EventBridge outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventHandlers.eventBus.eventBusName,
      exportName: 'LmsEventBusName',
    });
    new cdk.CfnOutput(this, 'EventBusArn', {
      value: eventHandlers.eventBus.eventBusArn,
      exportName: 'LmsEventBusArn',
    });
  }
}
