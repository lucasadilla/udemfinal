# Database configuration

The application connects to MongoDB using two environment variables that must be
set in both local development and deployed environments:

```bash
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/"
MONGODB_DB_NAME="<database-name>"
```

`MONGODB_URI` provides the connection string for your cluster while
`MONGODB_DB_NAME` specifies the exact database to use. Configure the same values
in `.env.local` and in your hosting provider so every environment points at the
same MongoDB database.

Restart the Next.js server after updating either variable to ensure the new
configuration is loaded.
