# FranchiseOS - Beginner's Guide

## Understanding Device Tokens (Question 4)

### What is a Device Token?

A **Device Token** is like a **password for your TV/display screen**. It's a unique code that allows a franchise's display device to connect to your system and receive content.

### Real-World Analogy

Think of it like this:
```
Your System = A TV Channel Headquarters
Device Token = A special cable box code
Franchise Screen = The TV at a restaurant
```

Just like a cable box needs a unique code to receive TV channels, each franchise screen needs a unique token to receive your content.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Register Franchise                             │
│  ----------------------------------------                │
│  You create a franchise in the dashboard                │
│  System generates: abc-123-xyz-789 (Device Token)       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Install Display App on Franchise Screen        │
│  ----------------------------------------                │
│  You give the token to the franchise owner              │
│  They enter it in their display app                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Screen Connects                                │
│  ----------------------------------------                │
│  Display app sends token to your server                 │
│  Server verifies: "Yes, this is a valid franchise!"     │
│  Screen starts receiving content                        │
└─────────────────────────────────────────────────────────┘
```

### Why Device Tokens Are Important

1. **Security**: Only authorized screens can connect
   - Random person can't just connect their screen
   - You control who sees your content

2. **Identification**: You know which screen is which
   - "Downtown Store" has token: abc-123
   - "Airport Location" has token: xyz-789

3. **Content Control**: You can assign different content to different screens
   - Downtown Store → Show local promotions
   - Airport Location → Show travel-related content

### Example Scenario

**You own a pizza chain with 3 locations:**

```
Location 1: Downtown Pizza
├─ Device Token: fos-token-downtown-001
├─ Assigned Content: Lunch specials, Local events
└─ Status: Online ✅

Location 2: Mall Pizza
├─ Device Token: fos-token-mall-002
├─ Assigned Content: Family deals, Kids menu
└─ Status: Online ✅

Location 3: Airport Pizza
├─ Device Token: fos-token-airport-003
├─ Assigned Content: Quick meals, Travel tips
└─ Status: Offline ❌
```

Each location has:
- Unique token (like a password)
- Different content based on their audience
- Status tracking (online/offline)

### Important Notes

⚠️ **NEVER share device tokens publicly!**
- Treat them like passwords
- Save them securely when generated
- Can't retrieve them later (only regenerate)

✅ **When to regenerate a token:**
- If token is compromised/leaked
- If device is stolen
- If franchise changes ownership

---

## Understanding API Configuration in Settings (Question 5)

### What is an API?

**API** = **Application Programming Interface**

Think of it as a **waiter in a restaurant**:
- You (frontend/dashboard) are the customer
- Kitchen (backend/server) prepares the food
- Waiter (API) takes your order and brings food back

### API Configuration Explained

When you see "API Configuration" in settings, it's asking:
**"Where is your backend server, and how do I talk to it?"**

### The Settings You'll See

#### 1. **API URL** (Where is the server?)

```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

**What it means:**
- This is the address of your backend server
- Like a phone number to call your server
- Dashboard uses this to send/receive data

**Example:**
```javascript
// When you upload a file:
Dashboard → "Hey API at http://localhost:3000/api, 
             here's a video to upload!"
API → "Got it! Saved to database."
```

#### 2. **API Key** (Password for admin access)

```
API_KEY=fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3
```

**What it means:**
- Secret password for admin operations
- Proves you're authorized to manage the system
- Different from device tokens (those are for screens)

**Security:**
- Keep this secret!
- Don't share in public code
- Change it in production

#### 3. **Environment** (Development vs Production)

```
Development: Testing on your computer
Production: Live system for real users
```

**What changes:**
- Development: Relaxed security, detailed errors
- Production: Strict security, minimal errors shown

### How API Configuration Works

```
┌──────────────────────────────────────────────────────────┐
│  Your Dashboard (Frontend)                               │
│  ─────────────────────────                               │
│  User clicks "Upload Video"                              │
│                                                           │
│  Dashboard checks settings:                              │
│  ✓ API URL: http://localhost:3000/api                    │
│  ✓ API Key: fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3     │
│                                                           │
│  Sends request:                                          │
│  POST http://localhost:3000/api/content/upload           │
│  Headers:                                                │
│    - X-API-Key: fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3 │
│    - Authorization: Bearer <your-jwt-token>              │
│  Body: [video file]                                      │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  Backend Server (API)                                    │
│  ─────────────────────                                   │
│  Receives request                                        │
│                                                           │
│  Checks:                                                 │
│  1. Is API Key correct? ✓                                │
│  2. Is JWT token valid? ✓                                │
│  3. Is file type allowed? ✓                              │
│  4. Is file size OK? ✓                                   │
│                                                           │
│  Saves video to server                                   │
│  Adds to database                                        │
│                                                           │
│  Sends response:                                         │
│  { success: true, data: { id: "123", url: "..." } }     │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  Dashboard Shows Success                                 │
│  ─────────────────────────                               │
│  "Video uploaded successfully! ✅"                        │
└──────────────────────────────────────────────────────────┘
```

### Common API Configuration Scenarios

#### Scenario 1: Local Development (Testing)

```env
# Frontend (.env.development)
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=fos-sk-a8f2c9d1e4b7a3f6c8d2e5b9a1c4f7d3
VITE_ENVIRONMENT=development
```

**Use when:**
- Testing on your computer
- Both frontend and backend running locally
- Before deploying to production

#### Scenario 2: Production (Live System)

```env
# Frontend (.env.production)
VITE_API_URL=https://api.yourdomain.com/api
VITE_API_KEY=your-production-api-key
VITE_ENVIRONMENT=production
```

**Use when:**
- Deployed to Netlify/Vercel
- Backend on VPS/cloud server
- Real users accessing the system

#### Scenario 3: Staging (Testing Production Setup)

```env
# Frontend (.env.staging)
VITE_API_URL=https://staging-api.yourdomain.com/api
VITE_API_KEY=staging-api-key
VITE_ENVIRONMENT=staging
```

**Use when:**
- Testing production-like environment
- Before deploying to real production
- Want to test with real URLs but not affect live users

### What Happens If API Configuration Is Wrong?

#### Wrong API URL
```
❌ Error: "Network error: Failed to fetch"
Why: Dashboard trying to connect to wrong address
Fix: Update VITE_API_URL to correct backend address
```

#### Wrong API Key
```
❌ Error: "401 Unauthorized: Invalid API Key"
Why: Backend doesn't recognize your API key
Fix: Make sure frontend and backend have matching API keys
```

#### CORS Error
```
❌ Error: "CORS policy: No 'Access-Control-Allow-Origin'"
Why: Backend not allowing requests from your frontend domain
Fix: Add your frontend URL to backend ALLOWED_ORIGINS
```

### Security Best Practices

1. **Never commit API keys to Git**
   ```bash
   # ✅ Good: Use .env files (gitignored)
   .env
   .env.local
   
   # ❌ Bad: Hardcode in source code
   const API_KEY = "fos-sk-abc123"  // DON'T DO THIS!
   ```

2. **Use different keys for dev/prod**
   ```
   Development: fos-dev-key-123
   Production: fos-prod-key-xyz (much stronger!)
   ```

3. **Rotate keys periodically**
   - Change API keys every 3-6 months
   - Especially if team members leave

### Troubleshooting API Issues

#### Problem: "Can't upload content"
```
Check:
1. Is backend running? (pm2 status)
2. Is API URL correct in frontend?
3. Is API key matching?
4. Check browser console for errors
```

#### Problem: "CORS error"
```
Solution:
1. Backend .env: ALLOWED_ORIGINS=http://localhost:5173
2. Restart backend: pm2 restart franchiseos-api
3. Refresh dashboard
```

#### Problem: "401 Unauthorized"
```
Solution:
1. Check if logged in (JWT token present)
2. Verify API key matches
3. Check token hasn't expired
```

---

## Quick Reference

### Device Token
- **Purpose**: Authenticate franchise display screens
- **Format**: UUID (e.g., `abc-123-xyz-789`)
- **Used by**: Display apps at franchise locations
- **Security**: Keep secret, regenerate if compromised

### API Key
- **Purpose**: Authenticate admin dashboard
- **Format**: Random string (32+ characters)
- **Used by**: Your admin dashboard (you)
- **Security**: Never share, use strong random value

### JWT Token
- **Purpose**: Session authentication after login
- **Format**: Encrypted string with expiry
- **Used by**: Dashboard after successful login
- **Security**: Auto-expires after 24 hours

---

## Summary

**Device Tokens** = Passwords for franchise screens
**API Configuration** = How dashboard talks to backend
**API Key** = Admin password for dashboard
**JWT Token** = Session ticket after login

All work together to create a secure system where:
1. You (admin) manage everything via dashboard
2. Franchise screens display assigned content
3. Everything is authenticated and secure

No external services needed - it's all self-contained! 🎉
