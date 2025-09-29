# Email configuration

The contact form now reads its SMTP credentials from environment variables so
you do not need to edit the source code. Configure the following variables in
`.env.local` (or the deployment environment) before starting the app:

```bash
CONTACT_EMAIL_USER="femmesetdroit.udem@gmail.com"
CONTACT_EMAIL_PASS="<GMAIL_APP_PASSWORD>"
# Optional overrides
# CONTACT_EMAIL_TO="alerts@example.com"
# CONTACT_EMAIL_FROM="Site Contact <alerts@example.com>"
# CONTACT_EMAIL_HOST="smtp.gmail.com"
# CONTACT_EMAIL_PORT=465
# CONTACT_EMAIL_SECURE=true
```

`CONTACT_EMAIL_PASS` must be a Gmail **App password** – Google blocks SMTP logins
with regular account passwords. After updating the environment variables, restart
the Next.js server so it loads the new credentials.

If transporter verification fails, double-check that the app password is
correct, SMTP access is enabled for the Gmail account, and the host/port values
match your email provider.
