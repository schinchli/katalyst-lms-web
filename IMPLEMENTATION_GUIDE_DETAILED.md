# LMS Platform - Detailed Step-by-Step Implementation Guide
## For Claude Code: Incremental Development with 100% Test Coverage

> **Purpose:** Break down every task into atomic, testable steps  
> **Approach:** Test-Driven Development (TDD) + Git commits after each step  
> **Coverage Target:** 100% unit tests, 80% integration tests  
> **Workflow:** Red → Green → Refactor → Commit → Push

---

## 🎯 DEVELOPMENT PRINCIPLES

### 1. Incremental Development
- Each subtask is < 2 hours of work
- Each subtask produces working, tested code
- Never break existing functionality
- Always run full test suite before commit

### 2. Test-Driven Development (TDD)
```
1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor for quality (REFACTOR)
4. Run full test suite
5. Commit with descriptive message
6. Push to feature branch
```

### 3. Git Workflow
```bash
# Start new task
git checkout develop
git pull origin develop
git checkout -b feature/task-1.1-aws-infrastructure

# After each subtask
git add .
git commit -m "feat(infra): add DynamoDB users table with tests"
git push origin feature/task-1.1-aws-infrastructure

# After task complete
# Create PR, get review, merge to develop
```

### 4. CRUD Operations Standard
Every data entity must have:
- ✅ CREATE with validation + test
- ✅ READ (single + list) + test
- ✅ UPDATE with validation + test
- ✅ DELETE (soft delete preferred) + test
- ✅ Error handling + test

---

## 📦 PHASE 1: MVP BACKEND (CRITICAL)


### TASK 1.1: AWS Infrastructure Setup (CDK)
**Duration:** 3-5 days | **Priority:** 🔴 CRITICAL | **Branch:** `feature/task-1.1-aws-infrastructure`

---

#### Subtask 1.1.1: Initialize CDK Project
**Duration:** 30 minutes | **Commit:** `feat(infra): initialize CDK project`

**Steps:**
1. Create CDK project structure
```bash
cd infrastructure/cdk
npm init -y
npm install aws-cdk-lib constructs
npm install -D @types/node typescript ts-node
npx cdk init app --language typescript
```

2. Create `infrastructure/cdk/bin/lms-stack.ts`
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LmsStack } from '../lib/lms-stack';

const app = new cdk.App();
new LmsStack(app, 'LmsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

3. Create `infrastructure/cdk/lib/lms-stack.ts` (empty for now)
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class LmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Resources will be added in next subtasks
  }
}
```

4. Test CDK synth
```bash
npx cdk synth
```

**Acceptance Criteria:**
- [ ] CDK project initializes without errors
- [ ] `cdk synth` produces CloudFormation template
- [ ] No TypeScript errors

**Git Commit:**
```bash
git add infrastructure/cdk
git commit -m "feat(infra): initialize CDK project with TypeScript"
git push origin feature/task-1.1-aws-infrastructure
```

---

#### Subtask 1.1.2: Create DynamoDB Users Table
**Duration:** 1 hour | **Commit:** `feat(infra): add DynamoDB users table`

**Steps:**
1. Create `infrastructure/cdk/lib/constructs/dynamodb-tables.ts`
```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DynamoDBTables extends Construct {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Users table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'lms-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // GSI for email lookup
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Tags
    cdk.Tags.of(this.usersTable).add('Environment', 'production');
    cdk.Tags.of(this.usersTable).add('Project', 'LMS');
  }
}
```

2. Update `infrastructure/cdk/lib/lms-stack.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBTables } from './constructs/dynamodb-tables';

export class LmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tables = new DynamoDBTables(this, 'DynamoDBTables');

    // Output table names
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: tables.usersTable.tableName,
      exportName: 'LmsUsersTableName',
    });
  }
}
```

3. Test CDK synth
```bash
npx cdk synth
```

4. Create test file `infrastructure/cdk/test/dynamodb-tables.test.ts`
```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('DynamoDB Tables', () => {
  test('Users table created with correct configuration', () => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'lms-users',
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('Users table has email GSI', () => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        },
      ],
    });
  });
});
```

5. Run tests
```bash
npm test
```

**Acceptance Criteria:**
- [ ] Users table defined with correct schema
- [ ] Email GSI configured
- [ ] Point-in-time recovery enabled
- [ ] Tests pass (100% coverage)
- [ ] CDK synth succeeds

**Git Commit:**
```bash
git add infrastructure/cdk
git commit -m "feat(infra): add DynamoDB users table with email GSI and tests"
git push origin feature/task-1.1-aws-infrastructure
```

---

#### Subtask 1.1.3: Create Remaining DynamoDB Tables
**Duration:** 2 hours | **Commit:** `feat(infra): add all DynamoDB tables`

**Steps:**
1. Add remaining tables to `dynamodb-tables.ts`
```typescript
// Quiz attempts table
this.quizAttemptsTable = new dynamodb.Table(this, 'QuizAttemptsTable', {
  tableName: 'lms-quiz-attempts',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'attemptId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
});

// GSI for quiz lookup
this.quizAttemptsTable.addGlobalSecondaryIndex({
  indexName: 'QuizIndex',
  partitionKey: { name: 'quizId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'completedAt', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

// User statistics table
this.userStatisticsTable = new dynamodb.Table(this, 'UserStatisticsTable', {
  tableName: 'lms-user-statistics',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Leaderboard tables (daily, monthly, global)
this.leaderboardDailyTable = new dynamodb.Table(this, 'LeaderboardDailyTable', {
  tableName: 'lms-leaderboard-daily',
  partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  timeToLiveAttribute: 'ttl',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Bookmarks table
this.bookmarksTable = new dynamodb.Table(this, 'BookmarksTable', {
  tableName: 'lms-bookmarks',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'questionId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

2. Add tests for each table
3. Run tests: `npm test`
4. Synth: `npx cdk synth`

**Acceptance Criteria:**
- [ ] All 6 tables defined
- [ ] Correct partition/sort keys
- [ ] GSIs configured where needed
- [ ] TTL configured for daily leaderboard
- [ ] Tests pass (100% coverage)

**Git Commit:**
```bash
git add infrastructure/cdk
git commit -m "feat(infra): add quiz-attempts, statistics, leaderboard, and bookmarks tables"
git push origin feature/task-1.1-aws-infrastructure
```

---

#### Subtask 1.1.4: Create S3 Buckets
**Duration:** 1 hour | **Commit:** `feat(infra): add S3 buckets with encryption`

**Steps:**
1. Create `infrastructure/cdk/lib/constructs/s3-buckets.ts`
```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class S3Buckets extends Construct {
  public readonly quizContentBucket: s3.Bucket;
  public readonly quizResultsBucket: s3.Bucket;
  public readonly learningContentBucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Quiz content bucket (public read via CloudFront)
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

    // Quiz results bucket (append-only, audit trail)
    this.quizResultsBucket = new s3.Bucket(this, 'QuizResultsBucket', {
      bucketName: `lms-quiz-results-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      objectLockEnabled: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Learning content bucket (videos, PDFs)
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

    // CORS for quiz content
    this.quizContentBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      maxAge: 3600,
    });
  }
}
```

2. Update `lms-stack.ts` to include S3 buckets
3. Add tests for S3 bucket configuration
4. Run tests: `npm test`

**Acceptance Criteria:**
- [ ] 3 S3 buckets created
- [ ] Encryption enabled
- [ ] Versioning enabled
- [ ] Lifecycle rules configured
- [ ] CORS configured for quiz content
- [ ] Tests pass

**Git Commit:**
```bash
git add infrastructure/cdk
git commit -m "feat(infra): add S3 buckets for quiz content, results, and learning materials"
git push origin feature/task-1.1-aws-infrastructure
```

---

