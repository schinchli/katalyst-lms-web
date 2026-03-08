import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

interface ApiGatewayProps {
  userPool: cognito.UserPool;
  quizAttemptsTable: dynamodb.Table;
  userStatisticsTable: dynamodb.Table;
  leaderboardDailyTable: dynamodb.Table;
  leaderboardMonthlyTable: dynamodb.Table;
  leaderboardGlobalTable: dynamodb.Table;
  eventBusArn: string;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigw.RestApi;
  public readonly quizSubmitFn: nodeLambda.NodejsFunction;
  public readonly progressFetchFn: nodeLambda.NodejsFunction;
  public readonly leaderboardFetchFn: nodeLambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const {
      userPool, quizAttemptsTable, userStatisticsTable,
      leaderboardDailyTable, leaderboardMonthlyTable, leaderboardGlobalTable,
      eventBusArn,
    } = props;

    // ── Shared Lambda defaults ────────────────────────────────────────────────
    const lambdaDefaults: Partial<nodeLambda.NodejsFunctionProps> = {
      runtime:      lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout:      cdk.Duration.seconds(10),
      memorySize:   512,
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['@aws-sdk/*'],
      },
      environment: {
        QUIZ_ATTEMPTS_TABLE:   quizAttemptsTable.tableName,
        USER_STATISTICS_TABLE: userStatisticsTable.tableName,
        EVENT_BUS_NAME:        events.EventBus.fromEventBusArn(this, 'ImportedBus', eventBusArn).eventBusName,
      },
    };

    const lambdasDir = path.join(__dirname, '../../../../backend/lambdas');

    // ── quizSubmit Lambda ─────────────────────────────────────────────────────
    this.quizSubmitFn = new nodeLambda.NodejsFunction(this, 'QuizSubmitFn', {
      ...lambdaDefaults,
      functionName: 'lms-quiz-submit',
      entry: path.join(lambdasDir, 'quizSubmit/index.ts'),
      description: 'Validates and stores quiz attempt, updates user statistics',
    });

    quizAttemptsTable.grantWriteData(this.quizSubmitFn);
    userStatisticsTable.grantWriteData(this.quizSubmitFn);

    // Grant EventBridge PutEvents permission
    this.quizSubmitFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: [eventBusArn],
    }));

    // ── progressFetch Lambda ──────────────────────────────────────────────────
    this.progressFetchFn = new nodeLambda.NodejsFunction(this, 'ProgressFetchFn', {
      ...lambdaDefaults,
      functionName: 'lms-progress-fetch',
      entry: path.join(lambdasDir, 'progressFetch/index.ts'),
      description: 'Returns user statistics and recent quiz attempts',
    });

    quizAttemptsTable.grantReadData(this.progressFetchFn);
    userStatisticsTable.grantReadData(this.progressFetchFn);

    // ── leaderboardFetch Lambda ───────────────────────────────────────────────
    this.leaderboardFetchFn = new nodeLambda.NodejsFunction(this, 'LeaderboardFetchFn', {
      ...lambdaDefaults,
      functionName: 'lms-leaderboard-fetch',
      entry: path.join(lambdasDir, 'leaderboardFetch/index.ts'),
      description: 'Returns leaderboard entries for a given period',
      environment: {
        USER_STATISTICS_TABLE:     userStatisticsTable.tableName,
        LEADERBOARD_DAILY_TABLE:   leaderboardDailyTable.tableName,
        LEADERBOARD_MONTHLY_TABLE: leaderboardMonthlyTable.tableName,
        LEADERBOARD_GLOBAL_TABLE:  leaderboardGlobalTable.tableName,
      },
    });

    leaderboardDailyTable.grantReadData(this.leaderboardFetchFn);
    leaderboardMonthlyTable.grantReadData(this.leaderboardFetchFn);
    leaderboardGlobalTable.grantReadData(this.leaderboardFetchFn);

    // ── REST API ──────────────────────────────────────────────────────────────
    this.api = new apigw.RestApi(this, 'LmsApi', {
      restApiName: 'lms-api',
      description: 'LMS platform REST API',
      defaultCorsPreflightOptions: {
        allowOrigins:  apigw.Cors.ALL_ORIGINS,
        allowMethods:  apigw.Cors.ALL_METHODS,
        allowHeaders:  ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName:    'v1',
        throttlingRateLimit:  100,
        throttlingBurstLimit: 200,
      },
    });

    // ── Cognito Authorizer ────────────────────────────────────────────────────
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'lms-cognito-authorizer',
      identitySource: apigw.IdentitySource.header('Authorization'),
    });

    const authOptions: apigw.MethodOptions = {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    };

    // ── Routes ────────────────────────────────────────────────────────────────
    // POST /quiz/submit
    const quizResource = this.api.root.addResource('quiz');
    const submitResource = quizResource.addResource('submit');
    submitResource.addMethod('POST', new apigw.LambdaIntegration(this.quizSubmitFn), authOptions);

    // GET /progress
    const progressResource = this.api.root.addResource('progress');
    progressResource.addMethod('GET', new apigw.LambdaIntegration(this.progressFetchFn), authOptions);

    // GET /leaderboard?period=daily|monthly|alltime
    const leaderboardResource = this.api.root.addResource('leaderboard');
    leaderboardResource.addMethod('GET', new apigw.LambdaIntegration(this.leaderboardFetchFn), authOptions);
  }
}
