# Supabase Email Confirmation Setup

## Issue: "No authentication token received" or "Please check your email to confirm"

This happens because Supabase has **email confirmation enabled by default**.

## Quick Fix: Disable Email Confirmation (Development Only)

### Option 1: Via Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Email Confirmation**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

### Option 2: Via SQL (If dashboard not accessible)

Run this SQL in the Supabase SQL Editor:

```sql
-- Disable email confirmation
UPDATE auth.config 
SET email_confirm_required = false;
```

## Production Setup (Keep Email Confirmation)

For production, you should keep email confirmation enabled and:

### 1. Configure Email Templates

Go to **Authentication** → **Email Templates** and customize:
- Confirmation email
- Reset password email
- Magic link email

### 2. Set up SMTP (Optional but recommended)

By default, Supabase uses their email service (limited to 3 emails/hour in free tier).

For production:
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Add your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
3. Configure sender email and credentials

### 3. Handle Email Confirmation in Signup Flow

Update the signup page to handle email confirmation:

```typescript
// In src/app/signup/page.tsx

const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  }
})

if (signUpError) throw signUpError

// Check if email confirmation is required
if (!authData.session) {
  // No session = email confirmation required
  setSuccess('Account created! Please check your email to confirm your account.')
  // Don't create workspace yet - wait for email confirmation
  return
}

// Session exists = no confirmation required or auto-confirmed
const token = authData.session.access_token
// Continue with workspace creation...
```

### 4. Create Email Confirmation Callback Page

Create `/src/app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to workspace creation or welcome page
  return NextResponse.redirect(new URL('/welcome', request.url))
}
```

## Current Setup (Development)

For now, I've updated the signup page to:

1. ✅ Get token from `authData.session` instead of separate call
2. ✅ Show helpful error if email confirmation is required
3. ✅ Log auth data and token status for debugging
4. ✅ Include `emailRedirectTo` for future email confirmation flow

## Testing After Disabling Confirmation

1. Disable email confirmation in Supabase dashboard
2. Go to http://localhost:3000/signup
3. Fill in the form
4. Submit
5. Should get token immediately
6. Workspace should be created
7. Should redirect to workspace

## Verify Settings

Check your current settings:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM auth.config;
```

Look for `email_confirm_required` - should be `false` for development.

## Alternative: Use Magic Links

Instead of password signup, you can use magic links (no password needed):

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: formData.email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  }
})
```

This sends an email with a link that logs the user in automatically.

---

**Recommended for Development**: Disable email confirmation  
**Recommended for Production**: Keep email confirmation + proper SMTP setup
