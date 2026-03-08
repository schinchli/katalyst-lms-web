import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('API Gateway', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  // ── Lambda functions ────────────────────────────────────────────────────────

  test('quizSubmit Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-quiz-submit',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      MemorySize: 512,
      Timeout: 10,
    });
  });

  test('progressFetch Lambda created with correct runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-progress-fetch',
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      MemorySize: 512,
      Timeout: 10,
    });
  });

  test('Lambda functions have DynamoDB table env vars', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'lms-quiz-submit',
      Environment: {
        Variables: Match.objectLike({
          QUIZ_ATTEMPTS_TABLE:   Match.anyValue(),
          USER_STATISTICS_TABLE: Match.anyValue(),
        }),
      },
    });
  });

  // ── REST API ────────────────────────────────────────────────────────────────

  test('REST API created', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('REST API has correct name', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'lms-api',
    });
  });

  test('REST API deployment stage is v1', () => {
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'v1',
    });
  });

  test('REST API throttling configured', () => {
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      MethodSettings: Match.arrayWith([
        Match.objectLike({
          ThrottlingRateLimit:  100,
          ThrottlingBurstLimit: 200,
        }),
      ]),
    });
  });

  // ── Cognito authorizer ──────────────────────────────────────────────────────

  test('Cognito authorizer created', () => {
    template.resourceCountIs('AWS::ApiGateway::Authorizer', 1);
  });

  test('Cognito authorizer uses Authorization header', () => {
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Name:           'lms-cognito-authorizer',
      IdentitySource: 'method.request.header.Authorization',
      Type:           'COGNITO_USER_POOLS',
    });
  });

  // ── Routes ──────────────────────────────────────────────────────────────────

  test('POST /quiz/submit method exists with Cognito auth', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod:    'POST',
      AuthorizationType: 'COGNITO_USER_POOLS',
    });
  });

  test('GET /progress method exists with Cognito auth', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod:    'GET',
      AuthorizationType: 'COGNITO_USER_POOLS',
    });
  });

  // ── Stack outputs ───────────────────────────────────────────────────────────

  test('ApiUrl output exported', () => {
    template.hasOutput('ApiUrl', {
      Export: { Name: 'LmsApiUrl' },
    });
  });
});
