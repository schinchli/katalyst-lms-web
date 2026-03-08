import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('S3 Buckets', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('Stack has exactly 3 S3 buckets', () => {
    template.resourceCountIs('AWS::S3::Bucket', 3);
  });

  test('All buckets have S3-managed encryption', () => {
    template.allResourcesProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
    });
  });

  test('All buckets block all public access', () => {
    template.allResourcesProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('All buckets have versioning enabled', () => {
    template.allResourcesProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
    });
  });

  test('Quiz content bucket has CORS rule for GET/HEAD', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
          },
        ],
      },
    });
  });

  test('Quiz content bucket has lifecycle rule to expire noncurrent versions', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            Status: 'Enabled',
          },
        ],
      },
    });
  });

  test('Quiz results bucket has object lock enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      ObjectLockEnabled: true,
    });
  });

  test('Learning content bucket has Intelligent-Tiering lifecycle transition', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Transitions: [
              {
                StorageClass: 'INTELLIGENT_TIERING',
                TransitionInDays: 30,
              },
            ],
            Status: 'Enabled',
          },
        ],
      },
    });
  });

  // ── Stack outputs ──────────────────────────────────────────────────────

  test('Quiz content bucket name output exported', () => {
    template.hasOutput('QuizContentBucketName', {
      Export: { Name: 'LmsQuizContentBucketName' },
    });
  });

  test('Quiz results bucket name output exported', () => {
    template.hasOutput('QuizResultsBucketName', {
      Export: { Name: 'LmsQuizResultsBucketName' },
    });
  });

  test('Learning content bucket name output exported', () => {
    template.hasOutput('LearningContentBucketName', {
      Export: { Name: 'LmsLearningContentBucketName' },
    });
  });
});
