# AWS Learning & Certification Platform

## Incremental, S3-First, Event-Driven Architecture

This project is structured to allow Claude Code to build incrementally without refactoring existing modules.

### Core Principles
- S3-first content delivery
- Event-driven architecture
- Minimal DynamoDB usage
- Modular feature extensions
- No breaking changes between phases

### Phase 1 (MVP)
- Cognito Authentication
- S3 + CloudFront static content
- Quiz submission Lambda
- Result storage in S3 (append-only)
- Basic progress summary

### Phase 2
- Premium gating (JWT claims)
- Signed CloudFront URLs
- Purchase validation Lambda

### Phase 3
- EventBridge async processors
- Badges, streaks, analytics

### Phase 4
- Blogs + offline caching

### Definition of Done (MVP)
- Quiz loads from S3
- Submission writes to S3
- No content in database
- Fully serverless
