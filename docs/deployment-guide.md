# Deployment Guide

## Environment Variables Setup

This application requires MongoDB environment variables to be configured in your deployment environment. Without these, the database content will not load.

### Required Environment Variables

You **must** set these two environment variables in your hosting provider:

1. **`MONGODB_URI`** - Your MongoDB connection string
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`
   - Get this from your MongoDB Atlas dashboard

2. **`MONGODB_DB_NAME`** - Your database name
   - Example: `udemfinal` or whatever you named your database

### Setting Environment Variables by Platform

#### Vercel
1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add both `MONGODB_URI` and `MONGODB_DB_NAME`
4. Make sure to select **Production**, **Preview**, and **Development** environments
5. **Redeploy** your application after adding variables

#### Netlify
1. Go to your site dashboard on Netlify
2. Navigate to **Site configuration** → **Environment variables**
3. Add both `MONGODB_URI` and `MONGODB_DB_NAME`
4. Click **Save**
5. **Redeploy** your site

#### Other Platforms (Railway, Render, etc.)
1. Find the **Environment Variables** or **Config** section in your dashboard
2. Add both `MONGODB_URI` and `MONGODB_DB_NAME`
3. Save and restart/redeploy your application

### Important Notes

- **Never commit** `.env.local` or `.env` files to git
- Use the **same values** as your local `.env.local` file
- After setting environment variables, you **must redeploy** for changes to take effect
- Environment variables are case-sensitive - use exact names: `MONGODB_URI` and `MONGODB_DB_NAME`

### Verifying Your Setup

After deployment, check your application logs for:
- ✅ No errors about "MONGODB_URI n'est pas configuré"
- ✅ Successful database connections
- ✅ Content loading from MongoDB

If you see errors, double-check:
1. Variable names are exactly correct (case-sensitive)
2. Values are correct (no extra spaces, quotes are handled by the platform)
3. You've redeployed after adding variables

### Troubleshooting

**Problem: Content not showing on deployed site**
- ✅ Check environment variables are set in your hosting platform
- ✅ Verify variable names match exactly (case-sensitive)
- ✅ Check deployment logs for MongoDB connection errors
- ✅ Ensure you redeployed after adding environment variables

**Problem: "MONGODB_URI n'est pas configuré" error**
- This means the environment variable is not set or not accessible
- Double-check the variable name and value in your hosting platform
- Make sure you selected the correct environment (Production/Preview)

**Problem: Connection timeout errors**
- Check your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs) or your hosting provider's IP ranges
- Verify your MongoDB connection string is correct

