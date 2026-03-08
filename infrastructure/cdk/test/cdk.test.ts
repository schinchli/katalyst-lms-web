import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('LmsStack', () => {
  test('Stack synthesizes successfully', () => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // Empty stack should have no resources yet
    expect(template).toBeDefined();
  });
});
