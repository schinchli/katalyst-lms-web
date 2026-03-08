import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('CloudFront Distribution', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('CloudFront distribution created', () => {
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('Distribution redirects HTTP to HTTPS', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  test('Distribution has HTTP2_AND_3 enabled', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        HttpVersion: 'http2and3',
      },
    });
  });

  test('Distribution uses PriceClass_100 (US/EU/Asia)', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_100',
      },
    });
  });

  test('Distribution has /learning/* additional behavior', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({
            PathPattern: '/learning/*',
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        ]),
      },
    });
  });

  test('Distribution compression enabled on default behavior', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          Compress: true,
        },
      },
    });
  });

  test('CloudFront domain name output exported', () => {
    template.hasOutput('CloudFrontDomainName', {
      Export: { Name: 'LmsCloudFrontDomainName' },
    });
  });

  test('CloudFront distribution ID output exported', () => {
    template.hasOutput('CloudFrontDistributionId', {
      Export: { Name: 'LmsCloudFrontDistributionId' },
    });
  });
});
