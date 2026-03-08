import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

interface EventHandlersProps {
  userStatisticsTable:     dynamodb.Table;
  leaderboardDailyTable:   dynamodb.Table;
  leaderboardMonthlyTable: dynamodb.Table;
  leaderboardGlobalTable:  dynamodb.Table;
}

export class EventHandlersConstruct extends Construct {
  public readonly eventBus: events.EventBus;
  public readonly streakProcessorFn:    nodeLambda.NodejsFunction;
  public readonly badgeProcessorFn:     nodeLambda.NodejsFunction;
  public readonly analyticsProcessorFn: nodeLambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: EventHandlersProps) {
    super(scope, id);

    const {
      userStatisticsTable,
      leaderboardDailyTable,
      leaderboardMonthlyTable,
      leaderboardGlobalTable,
    } = props;

    // ── Custom EventBus ───────────────────────────────────────────────────────
    this.eventBus = new events.EventBus(this, 'LmsEventBus', {
      eventBusName: 'lms-events',
    });

    const eventsDir = path.join(__dirname, '../../../../backend/events');

    const lambdaDefaults: Partial<nodeLambda.NodejsFunctionProps> = {
      runtime:      lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout:      cdk.Duration.seconds(30),
      memorySize:   256,
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['@aws-sdk/*'],
      },
    };

    // ── streakProcessor ───────────────────────────────────────────────────────
    this.streakProcessorFn = new nodeLambda.NodejsFunction(this, 'StreakProcessorFn', {
      ...lambdaDefaults,
      functionName: 'lms-streak-processor',
      entry: path.join(eventsDir, 'streakProcessor/index.ts'),
      description: 'Updates user daily streak on quiz submission',
      environment: {
        USER_STATISTICS_TABLE: userStatisticsTable.tableName,
      },
    });
    userStatisticsTable.grantReadWriteData(this.streakProcessorFn);

    // ── badgeProcessor ────────────────────────────────────────────────────────
    this.badgeProcessorFn = new nodeLambda.NodejsFunction(this, 'BadgeProcessorFn', {
      ...lambdaDefaults,
      functionName: 'lms-badge-processor',
      entry: path.join(eventsDir, 'badgeProcessor/index.ts'),
      description: 'Evaluates and awards badges on quiz submission',
      environment: {
        USER_STATISTICS_TABLE: userStatisticsTable.tableName,
      },
    });
    userStatisticsTable.grantReadWriteData(this.badgeProcessorFn);

    // ── analyticsProcessor ────────────────────────────────────────────────────
    this.analyticsProcessorFn = new nodeLambda.NodejsFunction(this, 'AnalyticsProcessorFn', {
      ...lambdaDefaults,
      functionName: 'lms-analytics-processor',
      entry: path.join(eventsDir, 'analyticsProcessor/index.ts'),
      description: 'Updates leaderboard tables on quiz submission',
      environment: {
        USER_STATISTICS_TABLE:     userStatisticsTable.tableName,
        LEADERBOARD_DAILY_TABLE:   leaderboardDailyTable.tableName,
        LEADERBOARD_MONTHLY_TABLE: leaderboardMonthlyTable.tableName,
        LEADERBOARD_GLOBAL_TABLE:  leaderboardGlobalTable.tableName,
      },
    });
    userStatisticsTable.grantReadData(this.analyticsProcessorFn);
    leaderboardDailyTable.grantReadWriteData(this.analyticsProcessorFn);
    leaderboardMonthlyTable.grantReadWriteData(this.analyticsProcessorFn);
    leaderboardGlobalTable.grantReadWriteData(this.analyticsProcessorFn);

    // ── EventBridge rule: lms.quiz.submitted → all processors ────────────────
    const quizSubmittedRule = new events.Rule(this, 'QuizSubmittedRule', {
      eventBus: this.eventBus,
      ruleName: 'lms-quiz-submitted-rule',
      description: 'Triggers processors when a quiz is submitted',
      eventPattern: {
        source:     ['lms'],
        detailType: ['lms.quiz.submitted'],
      },
    });

    quizSubmittedRule.addTarget(new targets.LambdaFunction(this.streakProcessorFn,    { retryAttempts: 2 }));
    quizSubmittedRule.addTarget(new targets.LambdaFunction(this.badgeProcessorFn,     { retryAttempts: 2 }));
    quizSubmittedRule.addTarget(new targets.LambdaFunction(this.analyticsProcessorFn, { retryAttempts: 2 }));
  }
}
