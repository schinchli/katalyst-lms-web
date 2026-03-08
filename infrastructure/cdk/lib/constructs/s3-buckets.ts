import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class S3Buckets extends Construct {
  public readonly quizContentBucket: s3.Bucket;
  public readonly quizResultsBucket: s3.Bucket;
  public readonly learningContentBucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Quiz content bucket (accessed via CloudFront)
    this.quizContentBucket = new s3.Bucket(this, 'QuizContentBucket', {
      bucketName: `lms-quiz-content-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.quizContentBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      maxAge: 3600,
    });

    // Quiz results bucket (append-only audit trail, object lock)
    this.quizResultsBucket = new s3.Bucket(this, 'QuizResultsBucket', {
      bucketName: `lms-quiz-results-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      objectLockEnabled: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Learning content bucket (videos, PDFs) with Intelligent-Tiering
    this.learningContentBucket = new s3.Bucket(this, 'LearningContentBucket', {
      bucketName: `lms-learning-content-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
