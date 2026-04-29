# Sayothix Caller — Setup Guide

AI Cold Calling Agent for Sayothix · Built with Next.js + Vapi + Twilio + Supabase + WhatsApp

---

## What this does

You upload a CSV of JB businesses → click "Call" → AI agent **Aira** dials them via Twilio → has a conversation using your Sayothix script → if she books an appointment, you get a **WhatsApp message** with the date/time/Google Meet link.

---

## Setup steps (do these in order)

### Step 1 — Push to GitHub

```bash
cd sayothix-caller
git init
git add .
git commit -m "Initial commit"
gh repo create sayothix-caller --private --source=. --push
# OR manually: create repo on github.com → git remote add origin <url> → git push -u origin main
```

### Step 2 — Set up Supabase (database)

1. Go to https://supabase.com → New Project
2. Open **SQL Editor** → paste contents of `supabase-schema.sql` → Run
3. Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3 — Buy Twilio number

1. https://console.twilio.com → Phone Numbers → Buy a number
2. **Country: Malaysia** (or US for instant testing — switch to MY later)
3. Use case: **Outbound Dialer**
4. After purchase, copy:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
   - The phone number → `TWILIO_PHONE_NUMBER`

⚠️ **Malaysia requires a Regulatory Bundle** (business docs, address proof). Takes 1–3 days. Use US number to test first.

### Step 4 — Set up Twilio WhatsApp Sandbox (for notifications to YOU)

1. Twilio Console → Messaging → Try it out → **Send a WhatsApp message**
2. Follow the QR code instructions to join the sandbox from your personal WhatsApp
3. Copy sandbox number → `TWILIO_WHATSAPP_FROM` (format: `whatsapp:+14155238886`)
4. Your personal WhatsApp number → `OWNER_WHATSAPP_NUMBER` (e.g. `+60123456789`)

### Step 5 — Set up Vapi (the AI agent)

1. https://dashboard.vapi.ai → Sign up
2. **Create Assistant** named "Aira"
   - Model: GPT-4o-mini (cheap)
   - Voice: 11Labs → pick a warm female voice (try "Sarah" or "Aria")
   - First Message: `Hi, is this {{contact_name}} from {{business_name}}?`
   - System Prompt: paste contents of `lib/vapi-prompt.ts` → `SAYOTHIX_SYSTEM_PROMPT`
3. **Phone Numbers → Import from Twilio** → enter your Twilio SID + Auth Token + the number
4. Copy:
   - API Keys → Private key → `VAPI_API_KEY`
   - Assistant ID → `VAPI_ASSISTANT_ID`
   - Phone Number ID → `VAPI_PHONE_NUMBER_ID`

### Step 6 — Deploy to Vercel

1. https://vercel.com → New Project → Import your GitHub repo
2. **Environment Variables** → paste every value from `.env.example` (with your real values)
3. Deploy
4. Copy your Vercel URL → `NEXT_PUBLIC_APP_URL`

### Step 7 — Set Vapi webhook

In Vapi dashboard → your Assistant → **Server URL**:
```
https://YOUR_VERCEL_DOMAIN.vercel.app/api/webhook/vapi
```
This is how Vapi tells your app what happened on each call.

### Step 8 — Test it

1. Open your Vercel URL
2. Go to **Leads** tab → upload `sample-leads.csv`
3. Click **Call** next to a lead (use YOUR own phone number first to test)
4. Aira should call you within 10 seconds
5. After hanging up, check **Call History** tab → transcript and outcome should appear within ~30 seconds

---

## File map

```
sayothix-caller/
├── app/
│   ├── page.tsx                    # Main dashboard (5 tabs)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── call/route.ts           # POST: trigger a call via Vapi
│       ├── leads/route.ts          # GET: list leads
│       ├── leads/upload/route.ts   # POST: CSV upload
│       ├── calls/route.ts          # GET: call history
│       └── webhook/vapi/route.ts   # POST: Vapi posts here after each call
├── lib/
│   ├── vapi.ts                     # Vapi REST API wrapper
│   ├── vapi-prompt.ts              # Aira's system prompt
│   ├── whatsapp.ts                 # Twilio WhatsApp sender
│   └── supabase.ts                 # DB client
├── supabase-schema.sql             # Run this in Supabase SQL Editor
├── sample-leads.csv                # Test data
├── .env.example                    # Copy to .env.local
└── package.json
```

---

## What happens when a call ends

1. Vapi finishes call → POSTs to `/api/webhook/vapi`
2. Webhook detects outcome (appointment / call-back / not-interested / no-answer / not-in-service)
3. Saves transcript + outcome to Supabase
4. **If appointment**: sends you a WhatsApp message with the booking details
5. Frontend refreshes → outcome shows in Call History tab

---

## Costs to expect

| Service     | Free tier | After |
|-------------|-----------|-------|
| Vapi        | $10 credit | ~$0.10/min |
| Twilio MY # | None | ~$3/month + $0.04/min |
| Twilio WhatsApp | Sandbox free | $0.005/msg |
| Supabase    | 500MB free | $25/mo |
| Vercel      | Free hobby | $20/mo |

Per call cost: roughly **$0.20–0.30** for a 3-minute call.

---

## Troubleshooting

**Aira doesn't call**
- Check Vercel logs (Vercel → your project → Deployments → Logs)
- Check Vapi dashboard → Calls → see error

**No WhatsApp received**
- Make sure you joined the Twilio sandbox from your phone first
- Check `TWILIO_WHATSAPP_FROM` includes the `whatsapp:` prefix

**Webhook doesn't fire**
- Make sure Vapi Server URL is set in Assistant settings
- Test the endpoint: `curl -X POST https://YOUR_DOMAIN/api/webhook/vapi -d '{}'`
