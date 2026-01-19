# Security Policy

## Supported Versions

Currently, only the latest version of SambungChat is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SambungChat seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the project maintainers. Your report should include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested mitigations or fixes (if available)

**Email:** security@sambunghub.com

### What to Expect

- **Confirmation:** We will acknowledge receipt of your report within 48 hours
- **Timeline:** We will provide an estimated timeline for addressing the vulnerability
- **Coordination:** We will work with you to understand and validate the issue
- **Disclosure:** We will coordinate disclosure with you to ensure users have time to update

### Security Best Practices for Contributors

When contributing to SambungChat, please follow these security guidelines:

#### API Key Handling

- **Never commit API keys** to the repository
- Use environment variables for all sensitive credentials
- API keys stored in the database are encrypted using AES-256
- Never log sensitive data in error messages or console output

#### Input Validation

- Always validate and sanitize user input
- Use Zod schemas for runtime type checking
- Follow the principle of least privilege for data access

#### Authentication & Authorization

- All API routes must implement proper authentication checks
- Use Better-Auth session management for protected routes
- Validate user permissions before data mutations

#### Dependencies

- Keep dependencies up to date
- Review security advisories for dependencies
- Use `bun audit` to check for known vulnerabilities

## Security Features

### Encryption

- API keys are encrypted at rest using AES-256 encryption
- Database credentials are stored securely as environment variables

* Better-Auth secret is used for session token signing

### Authentication

- Password-based authentication with secure hashing
- Session-based authentication with Better-Auth
- Configurable session expiration

### CORS Configuration

- CORS is properly configured to only allow requests from trusted origins
- Credentials are not shared across origins

### SQL Injection Protection

- All database queries use parameterized statements via Drizzle ORM
- No raw SQL queries are used in the application

## Dependency Scanning

We use automated tools to scan for vulnerabilities:

- **Bun audit:** Runs automatically in CI pipeline
- **Dependabot:** Monitors dependencies for security advisories
- **GitHub Dependabot Alerts:** Enabled for this repository

## Security Audits

Periodic security audits are performed as part of our development roadmap:

- Code review for common vulnerabilities (OWASP Top 10)
- SQL injection testing
- XSS vulnerability testing
- CORS configuration validation
- Authentication and authorization flow testing

## License

This project is licensed under AGPL-3.0, which includes important provisions regarding:

- Source code availability for deployed instances
- Network use provisions for web services
- User freedom to study and modify the software

For more information, see the [LICENSE](../LICENSE) file.

## Security Contacts

For general security questions or concerns, please contact:

- **Email:** security@sambunghub.com
- **GitHub:** Use GitHub's private vulnerability reporting feature if available

---

Thank you for helping keep SambungChat and its users safe!
