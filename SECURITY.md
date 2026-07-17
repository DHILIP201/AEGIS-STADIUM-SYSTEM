# Security Policy — AEGIS OS

## Reporting Vulnerabilities
If you discover a security vulnerability, please email `security@aegis-os.org`. We will respond within 48 hours.

## Security Practices
- **Data Anonymization**: All camera feeds are anonymized at the edge to prevent identity capture.
- **Token Protection**: API keys are loaded via `.env` files and never checked into source control.
- **CORS Protection**: REST endpoints restrict allowed origins.
