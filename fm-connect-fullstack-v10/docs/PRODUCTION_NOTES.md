# Production Upgrade Notes

This package is intentionally simple so it can run immediately.

For production, upgrade these areas:

1. Database
   - Replace `data/db.json` with PostgreSQL.
   - Add migrations and indexes.

2. Authentication
   - Replace demo passwords with bcrypt/argon2 hashing.
   - Add JWT or secure cookie sessions.
   - Add email/mobile OTP and Google login.

3. File Uploads
   - Replace local uploads with S3/Azure Blob/Cloud Storage.
   - Add file type, resolution, and size validation.
   - Add virus scanning for uploaded documents.

4. Email/SMS
   - Add SendGrid/AWS SES or another email provider.
   - Add Sri Lankan SMS gateway for OTP and reminders.

5. Payments
   - Add hosted checkout for subscriptions, counseling, and tuition.
   - Add webhooks, invoice generation, refunds, and settlements.

6. Security
   - Add rate limiting, CSRF protection where needed, strong CORS policy, audit logs, and monitoring.

7. Deployment
   - Use a Node hosting platform, VPS, container, or cloud app service.
   - Configure environment variables and backups.
