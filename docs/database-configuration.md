# Database Configuration

The application uses MongoDB for data storage. When MongoDB is not configured, it automatically falls back to JSON file storage in the `data/` directory.

## Quick Setup

### 1. Create a MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (choose the free M0 tier)
4. Wait for the cluster to finish provisioning (takes a few minutes)

### 2. Get Your Connection String

1. In MongoDB Atlas, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** as the driver
4. Copy the connection string (it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)

### 3. Configure Database Access

1. In MongoDB Atlas, go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and password (save these securely!)
5. Set user privileges to **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### 4. Configure Network Access

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ **Note**: For production, restrict this to your server's IP address
4. Click **"Confirm"**

### 5. Update Your Connection String

Replace `<username>` and `<password>` in your connection string with the credentials you created:

```
mongodb+srv://myusername:mypassword@cluster0.xxxxx.mongodb.net/
```

### 6. Create `.env.local` File

In your project root directory (`udemfinal/`), create a file named `.env.local`:

```bash
# MongoDB Configuration
MONGODB_URI="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/"
MONGODB_DB_NAME="udem"
```

**Important Notes:**
- Replace `your-username` and `your-password` with your actual MongoDB credentials
- Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address
- The database name `udem` is optional - if omitted, it will default to `udem`
- Make sure `.env.local` is in your `.gitignore` file (never commit credentials!)

### 7. Restart Your Development Server

After creating/updating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

You should see the MongoDB connection working without errors!

## Environment Variables

The application supports two environment variable formats:

### Option 1: Standard Variables (Recommended)
```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/"
MONGODB_DB_NAME="udem"
```

### Option 2: NEXT_PUBLIC_ Variables (For deployments that only expose public vars)
```bash
NEXT_PUBLIC_MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/"
NEXT_PUBLIC_MONGODB_DB_NAME="udem"
```

## Database Name Resolution

The application determines the database name in this order:
1. `MONGODB_DB_NAME` or `NEXT_PUBLIC_MONGODB_DB_NAME` environment variable
2. Database name from the URI path (e.g., `mongodb://.../mydb`)
3. `appName` query parameter in the URI
4. Default: `"udem"`

## Fallback Behavior

If `MONGODB_URI` is not configured:
- The application automatically uses JSON file storage
- Data is stored in the `data/` directory
- Files created: `articles.json`, `events.json`, `podcasts.json`, `content.json`, `home_sponsors.json`, `guide_sponsors.json`, `users.json`
- All API endpoints continue to work normally

## Troubleshooting

### Connection Errors

**Error: "MongoServerError: bad auth"**
- Check your username and password in the connection string
- Verify the user exists in MongoDB Atlas Database Access

**Error: "MongoServerSelectionError: connection timeout"**
- Check your IP address is allowed in Network Access
- Try adding `0.0.0.0/0` temporarily for testing

**Error: "MongoParseError: Invalid connection string"**
- Make sure your connection string is wrapped in quotes
- Check for special characters in password (may need URL encoding)

### Special Characters in Password

If your password contains special characters like `@`, `#`, `%`, etc., you need to URL-encode them:

- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- `&` becomes `%26`

Example:
```bash
# Password: "my@pass#word"
MONGODB_URI="mongodb+srv://user:my%40pass%23word@cluster.mongodb.net/"
```

### Verify Connection

After setting up, check your terminal when running `npm run dev`. You should see:
- No MongoDB connection errors
- No warnings about using JSON fallback storage
- API endpoints returning data successfully

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add the environment variables in your hosting platform's dashboard
2. Use the same `MONGODB_URI` and `MONGODB_DB_NAME` values
3. Restrict Network Access in MongoDB Atlas to your server's IP addresses
4. Consider using environment-specific database names (e.g., `udem-prod`)

## Security Best Practices

1. ✅ Never commit `.env.local` to git
2. ✅ Use strong passwords for database users
3. ✅ Restrict network access to specific IPs in production
4. ✅ Rotate database passwords regularly
5. ✅ Use different databases for development and production
