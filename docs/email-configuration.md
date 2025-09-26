# Email configuration

The contact form no longer depends on environment variables for its SMTP
settings. Instead, the Gmail configuration lives directly in
[`lib/mailer.js`](../lib/mailer.js). Update the hard-coded credentials before
deploying the site so outgoing email succeeds.

## Gmail setup steps

1. Enable two-factor authentication on the Gmail account if it is not already
   enabled.
2. Generate an **App password** from Google Account → Security → App passwords.
   Google only allows SMTP access with an app password – your regular account
   password will fail.
3. Open `lib/mailer.js` and replace the `REPLACE_WITH_GMAIL_APP_PASSWORD`
   placeholder with the 16-character app password. Update the `defaults.from`
   and `defaults.to` values if the project should send email from or to a
   different address.
4. Restart the Next.js server so it picks up the updated code.

If the transporter fails to verify at startup, double-check that the app
password was entered correctly and that SMTP access is allowed on the Gmail
account.
