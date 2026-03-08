# STEERING DOCUMENT FOR CLAUDE

## Development Guardrails

1. Never rewrite working modules.
2. Extend via new folders and modules only.
3. Keep Lambda functions single-responsibility.
4. Use environment variables for config.
5. Avoid database unless strictly required.
6. Use S3 for question banks and results.
7. Use EventBridge for async workflows.
8. Keep API execution under 300ms average.
9. Avoid synchronous Lambda chaining.
10. Show progress summary after each phase.

## Visual Progress Requirement

After completing each phase:
- Output completed modules list
- Output architecture state summary
- Confirm no refactor required
- Confirm backward compatibility

## Token Optimization

- Generate only new files per phase
- Do not regenerate entire codebase
- Avoid repeating infrastructure code
