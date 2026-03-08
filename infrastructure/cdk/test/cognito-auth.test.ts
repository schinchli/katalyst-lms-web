import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { LmsStack } from '../lib/lms-stack';

describe('Cognito Auth', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new LmsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('User pool created', () => {
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
  });

  test('User pool allows self sign-up with email alias', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'lms-user-pool',
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
      },
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    });
  });

  test('User pool enforces password policy', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireUppercase: true,
          RequireNumbers: true,
          RequireSymbols: false,
        },
      },
    });
  });

  test('User pool account recovery is email only', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AccountRecoverySetting: {
        RecoveryMechanisms: [
          { Name: 'verified_email', Priority: 1 },
        ],
      },
    });
  });

  test('User pool has optional MFA with TOTP', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      MfaConfiguration: 'OPTIONAL',
      EnabledMfas: Match.arrayWith(['SOFTWARE_TOKEN_MFA']),
    });
  });

  test('User pool has custom role and subscription attributes', () => {
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Schema: Match.arrayWith([
        Match.objectLike({ Name: 'role', AttributeDataType: 'String', Mutable: true }),
        Match.objectLike({ Name: 'subscription', AttributeDataType: 'String', Mutable: true }),
      ]),
    });
  });

  // ── App client ─────────────────────────────────────────────────────────

  test('User pool client created', () => {
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
  });

  test('App client uses SRP auth flow only', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ClientName: 'lms-app-client',
      ExplicitAuthFlows: Match.arrayWith(['ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH']),
    });
  });

  test('App client has no client secret (public client)', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      GenerateSecret: false,
    });
  });

  test('App client prevents user existence errors', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      PreventUserExistenceErrors: 'ENABLED',
    });
  });

  // ── Stack outputs ──────────────────────────────────────────────────────

  test('UserPoolId output exported', () => {
    template.hasOutput('UserPoolId', {
      Export: { Name: 'LmsUserPoolId' },
    });
  });

  test('UserPoolClientId output exported', () => {
    template.hasOutput('UserPoolClientId', {
      Export: { Name: 'LmsUserPoolClientId' },
    });
  });
});
