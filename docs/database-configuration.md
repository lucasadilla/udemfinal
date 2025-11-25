# Database configuration

The application connects to MongoDB using two environment variables that should
be set in both local development and deployed environments:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/"
MONGODB_DB_NAME="<database-name>"
```

`MONGODB_URI` provides the connection string for your cluster while
`MONGODB_DB_NAME` specifies the exact database to use. Configure the same values
in `.env.local` and in your hosting provider so every environment points at the
same MongoDB database. If `MONGODB_DB_NAME` is omitted, the application will try
to infer the database from the URI path, then from the `appName` query
parameter, and finally falls back to `udem` (the Atlas database name used in the
sample configuration). This avoids connecting to the `test` database by default
when your URI doesn’t embed a database name.

If your deployment only exposes variables with the `NEXT_PUBLIC_` prefix, the
app will now also accept `NEXT_PUBLIC_MONGODB_URI` and
`NEXT_PUBLIC_MONGODB_DB_NAME` as equivalents. Keep the values the same across
the private and `NEXT_PUBLIC_` variants to avoid configuration drift.

Restart the Next.js server after updating either variable to ensure the new
configuration is loaded.
