# Security Policy

## Supported Versions

The following versions of DTMIS are currently supported with security updates and critical patches.

| Version | Supported | Status |
| ------- | ---------- | ------ |
| 1.3.x   | ✅ | Active Support |
| 1.2.x   | ⚠️ | Security Fixes Only |
| < 1.2   | ❌ | End of Life |

> Users are strongly encouraged to upgrade to the latest stable release to receive security patches, vulnerability fixes, and platform improvements.

---

## Security Measures

DTMIS implements multiple layers of security controls to protect application data, user accounts, and system integrity, including:

- JWT-based authentication and authorization
- Role-Based Access Control (RBAC)
- Protected API endpoints
- CSRF and CORS protection
- Secure password hashing
- Input validation and serializer sanitization
- Audit logging and transaction tracking
- Environment-based secret management
- Database integrity constraints
- Session expiration and token refresh handling

Additional security improvements are continuously evaluated and integrated into future releases.

---

## Reporting a Vulnerability

If you discover a security vulnerability in DTMIS, report it responsibly and privately.

### Reporting Channels

Please submit vulnerability reports through one of the following channels:

- Internal IT Administrator
- System Developer or Maintainer
- Official project repository security reporting feature
- Official organizational email address

> Do **not** disclose vulnerabilities publicly until they have been investigated and resolved.

---

## What to Include in Your Report

To help speed up investigation and remediation, include the following details:

- Description of the vulnerability
- Steps to reproduce the issue
- Affected modules, endpoints, or components
- Potential impact or exploitation scenario
- Screenshots, logs, or proof-of-concept (if applicable)
- Suggested mitigation (optional)

Reports with clear reproduction steps are prioritized.

---

## Response Timeline

DTMIS maintainers aim to follow this response process:

| Stage | Expected Time |
| ------ | -------------- |
| Initial acknowledgment | Within 72 hours |
| Initial assessment | Within 7 business days |
| Fix development | Depends on severity |
| Public disclosure | After patch deployment |

Critical vulnerabilities may receive immediate emergency patches.

---

## Vulnerability Severity Levels

| Severity | Description |
| -------- | ----------- |
| Critical | Remote code execution, authentication bypass, or full database compromise |
| High | Privilege escalation, sensitive data exposure, or major authorization flaws |
| Medium | Limited data leaks or exploitable logic flaws |
| Low | Minor issues with minimal security impact |

---

## Responsible Disclosure Policy

We support responsible disclosure and appreciate ethical security research.

Researchers who report vulnerabilities in good faith will:

- Not be subject to legal action for responsible testing
- Receive acknowledgment for valid findings
- Help improve the security and reliability of DTMIS

Abuse, unauthorized data access, destructive testing, or public exploitation before remediation is strictly prohibited.

---

## Security Update Policy

Security patches may be released independently from feature updates. In severe cases:

- Temporary mitigations may be deployed immediately
- Certain services or endpoints may be restricted
- Forced upgrades may be required for deprecated versions

Always monitor release notes and changelogs for security advisories.

---

## Best Practices for Deployment

Organizations deploying DTMIS should:

- Use HTTPS in production
- Rotate secrets and JWT signing keys regularly
- Restrict database exposure to trusted networks
- Enable firewall and intrusion monitoring
- Perform regular backups
- Keep dependencies updated
- Limit administrator account access
- Use strong password policies

Failure to follow secure deployment practices may expose the system to avoidable risks.
