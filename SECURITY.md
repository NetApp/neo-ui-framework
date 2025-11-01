# 🔒 Security Policy

NetApp takes the security of our software products and services seriously, including all of the open source code repositories managed through our GitHub organizations, such as [NetApp](https://github.com/NetApp).  

## Supported Versions

The `main` branch and the latest tagged release receive security updates. Older releases should be upgraded to the most recent patch before requesting assistance.

## Reporting Potential Security Issues

If you believe you have found a potential security vulnerability in any NetApp-owned repository, please report it to us through coordinated disclosure.

1. **Do not disclose publicly.**
2. Email the NetApp Neo security contact (ng-innovation-labs-git[@]netapp.com) with:
   - Detailed description of the vulnerability.
   - Steps to reproduce and, if possible, proof-of-concept code.
   - Impact assessment and affected versions.
3. Encrypt sensitive reports when possible (GPG key available upon request).

This information will help us triage your report more quickly.

## Responsible Disclosure Guidelines

*  Allow maintainers reasonable time to remediate (minimum 30 days).
*  Coordinate any public disclosure with the maintainers.
*  Provide fixes or mitigation suggestions when feasible.

## Policy
If we verify a reported security vulnerability, our policy is:

* We will patch the current release branch, as well as the immediate prior minor release branch.  
* After patching the release branches, we will immediately issue new security fix releases for each patched release branch.
* A security advisory will be released on the project GitHub repository detailing the vulnerability, as well as recommendations for end-users to protect themselves.

## Secure Development Practices

### Dependency Management

```bash
# Regularly audit dependencies
npm audit

# Update to fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

**Practices**:
- Run `npm audit` before every release
- Review and update dependencies quarterly
- Monitor GitHub Dependabot alerts
- Pin major versions to avoid breaking changes

#### Code Security

**Avoid**:
- Hardcoded credentials or secrets
- Sensitive data in console.log statements
- Storing tokens in localStorage (use sessionStorage or memory)
- Bypassing TypeScript strict mode
- Disabling ESLint security rules

**Do**:
- Use environment variables for configuration
- Sanitize user inputs
- Validate API responses
- Use type-safe API clients
- Follow principle of least privilege

#### TypeScript Strict Mode

Already enforced in `tsconfig.json`:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noUncheckedSideEffectImports": true
}
```

This catches many security issues at compile time.

### Deployment

#### Environment Variables

**Never commit**:
- `.env.local`
- `.env.production`
- Any file containing secrets

**Use**:
- Environment-specific configuration
- Container orchestration secrets (Kubernetes, Docker Swarm)
- Secret management services (HashiCorp Vault, AWS Secrets Manager)

#### Docker Security

**Best Practices**:

1. **Minimal Base Image**
   ```dockerfile
   FROM nginx:1.27-alpine  # Alpine for smaller attack surface
   ```

2. **Non-Root User**
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S neo -u 1001
   USER neo
   ```

3. **Read-Only Filesystem** (where possible)
   ```dockerfile
   VOLUME /tmp
   VOLUME /var/cache/nginx
   ```

4. **No Unnecessary Packages**
   - Don't install development dependencies in production
   - Remove build artifacts after multi-stage builds

5. **Security Scanning**
   ```bash
   # Scan for vulnerabilities
   docker scan neo-ui-framework
   
   # Use Trivy for comprehensive scanning
   trivy image neo-ui-framework
   ```

#### nginx Configuration

**Security Headers** (add to `nginx.conf`):

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;" always;

# HSTS (if using HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**API Proxy Security**:

```nginx
location /api {
    # Restrict to known backend
    proxy_pass $NEO_API;
    
    # Don't expose backend details
    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
    
    # Timeout limits
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Size limits
    client_max_body_size 10M;
}
```

#### HTTPS/TLS

**Production Requirements**:

1. **Always use HTTPS** in production
2. **TLS 1.2+** minimum
3. **Strong cipher suites**:
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
   ssl_prefer_server_ciphers on;
   ```
4. **Certificate Management**: Use Let's Encrypt or enterprise CA

### Runtime Hardening

#### Authentication

**Current Implementation**:
- JWT bearer token authentication
- Token stored in React state (memory)
- Automatic session expiration handling

**Enhancements**:
- [ ] Implement token refresh mechanism
- [ ] Add session timeout warnings
- [ ] Support multi-factor authentication
- [ ] Implement rate limiting on login attempts

#### Authorization

**Current**:
- Role-based access (admin/standard user)
- Backend enforces permissions

**Best Practices**:
- Never trust client-side authorization checks
- Always validate on backend
- Use principle of least privilege

#### Data Protection

**In Transit**:
- ✅ HTTPS (production requirement)
- ✅ TLS for API communication
- ✅ Secure WebSocket connections (if applicable)

**At Rest**:
- Backend responsibility (not UI framework)
- Ensure Neo API encrypts sensitive data

**In Browser**:
- ❌ Don't store sensitive data in localStorage
- ✅ Use sessionStorage for temporary data
- ✅ Clear on logout
- ✅ No sensitive data in URLs

#### Input Validation

**Already Implemented**:
- Zod schema validation for forms
- TypeScript type checking
- React Hook Form validation

**Additional**:
- Sanitize before rendering user content
- Validate file uploads (size, type)
- Escape special characters in search queries

### Monitoring & Logging

#### Access Logs

Review nginx access logs for:
- Unusual request patterns
- Failed authentication attempts
- Suspicious API calls
- Rate limiting violations

#### Application Logs

Monitor for:
- Authentication errors
- API failures
- Client-side errors (via error boundaries)
- Performance issues

#### Security Events

Alert on:
- Multiple failed login attempts
- Privilege escalation attempts
- Unusual API access patterns
- Large data exports

## Credential Management

### Neo API Credentials

**Storage**:
- ❌ Never in code or version control
- ❌ Never in client-side storage
- ✅ Entered by user at runtime
- ✅ Validated by backend
- ✅ Cleared on logout

**Transmission**:
- ✅ HTTPS only
- ✅ Form data (not URL parameters)
- ✅ Bearer token for subsequent requests

### Share Credentials

**Backend Responsibility**:
- Encrypted storage
- Access control
- Audit logging

**UI Best Practices**:
- Password input masking
- No credential echo
- Clear form on cancel
- Warn before password changes

## Incident Response

### If You Discover an Exploit

1. **Immediate Actions**:
   - Rotate all credentials
   - Review access logs
   - Identify affected systems
   - Contain the breach

2. **Investigation**:
   - Determine scope of compromise
   - Identify attack vector
   - Document timeline
   - Preserve evidence

3. **Remediation**:
   - Apply security patches
   - Update configurations
   - Implement additional controls
   - Test thoroughly

4. **Recovery**:
   - Restore from clean backups
   - Verify system integrity
   - Monitor for recurrence

5. **Communication**:
   - Notify affected users
   - Report to security team
   - Comply with regulations (GDPR, etc.)
   - Post-mortem analysis

### Disclosure Timeline

After remediation:
1. Notify users of patch availability
2. Provide upgrade instructions
3. Publish security advisory (30 days minimum after fix)
4. Credit security researchers

## Compliance & Regulations

### GDPR (if applicable)

- Right to erasure (user deletion)
- Data minimization
- Purpose limitation
- Consent management

### SOC 2 / ISO 27001 (if applicable)

- Access controls
- Encryption requirements
- Audit logging
- Incident response procedures

## Security Checklist

Before deploying to production:

- [ ] All dependencies audited (`npm audit`)
- [ ] Secrets removed from code and configs
- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured in nginx
- [ ] CSP policy defined and tested
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting implemented
- [ ] Logging and monitoring configured
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented
- [ ] Security training completed for team

## 🆘 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---
**Remember**: Security is everyone's responsibility. When in doubt, ask!