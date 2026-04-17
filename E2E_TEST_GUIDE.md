# Phase 1 MVP - Complete E2E Test Guide

This guide walks through testing the complete Phase 1 MVP flow: OAuth callback → merchant creation → dashboard access.

## Prerequisites

- Python 3.9+
- FastAPI dependencies installed (`pip install -r backend/requirements.txt`)
- Frontend served on localhost:3000 (Python HTTP server, Node.js, or VS Code Live Server)

## Step-by-Step Testing

### 1. Start Backend Server

```bash
cd backend
python3 -m uvicorn src.app-entrypoint.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Started server process [1234]
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 2. Start Frontend Server

In a new terminal:

```bash
cd frontend
python3 -m http.server 3000
```

Expected output:
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

### 3. Test Backend Health Check

Before opening frontend, verify backend is ready:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

### 4. Test OAuth Callback (Direct API Call)

In a separate terminal, simulate OAuth callback:

```bash
curl "http://localhost:8000/api/oauth/callback?code=test-code&state=test-state"
```

Expected response (should succeed):
```json
{
  "status": "success",
  "message": "Merchant registered successfully",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "dashboard_url": "http://localhost:3000/dashboard.html"
}
```

Note the `merchant_id` and `token` for later use.

### 5. Test Dashboard API (Manual API Call)

Using the token from step 4:

```bash
TOKEN="<paste-token-from-step-4>"

# Get merchant profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/merchant/profile

# Get trial status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/merchant/trial

# Get dashboard overview
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/merchant/dashboard
```

Expected responses should include:
- Profile: store_name, merchant_email, salla_store_id, language
- Trial: trial_active, trial_start_date, trial_end_date, remaining_days (should be ~14)
- Dashboard: setup_state, trial_remaining_days, member_count (0), monthly_revenue (0)

### 6. Test Frontend - Full UI Flow

1. **Open browser**: http://localhost:3000
2. **Expected screen**: Login page with:
   - 📱 emoji logo
   - Title: "تسجيل الدخول" (or "Login" if English)
   - Two buttons: "تسجيل الدخول عبر Salla" + "تسجيل دخول تجريبي"
   - Info box with Phase 1 MVP note
   - Language toggle (EN / العربية)

3. **Click "تسجيل دخول تجريبي" (Demo Login)**:
   - Button should disable (show spinner)
   - Backend creates merchant (check terminal logs)
   - Token stored in localStorage
   - Auto-redirect to dashboard.html

4. **Expected dashboard screen**:
   - Header with "Member Plus Dashboard" title + Language toggle
   - Red/Pink trial countdown card showing ~14 days remaining
   - "ملف المتجر" card (Store Profile) with:
     - Store Name: "Demo Store" (or similar mock)
     - Email: "merchant@example.com"
     - Store ID: "mock-store-123"
     - Language: "العربية" (or "English")
   - "حالة التجربة" card (Trial Status) with dates
   - "خطوات الإعداد" card (Setup Progress)
   - Green success message

5. **Click Language Toggle**:
   - Page should flip to English (LTR layout)
   - All Arabic text should be English
   - Click again to flip back to Arabic (RTL layout)

### 7. Test Error Handling

#### Missing Token
1. Clear localStorage: `localStorage.clear()` in console
2. Refresh dashboard.html
3. Should show error: "لم يتم العثور على رمز المصادقة"

#### Invalid Token
1. In console: `localStorage.setItem('merchant_token', 'invalid-token')`
2. Refresh dashboard.html
3. Should show error about authentication failure

#### Wrong CORS Origin (if applicable)
If frontend runs on different port/origin:
- Browser console should show CORS error
- Check backend logs
- Verify CORS middleware includes your origin in allowed_origins list

### 8. Test Multiple Merchants

Create second merchant:

```bash
curl "http://localhost:8000/api/oauth/callback?code=test-code-2&state=test-state-2"
```

This returns new merchant_id and token. Each merchant should:
- See only their own profile
- Have independent trial countdown
- Cannot access other merchants' data (401 Unauthorized if trying with wrong token)

### 9. Check Backend Logs

Monitor backend terminal for:

```
INFO: POST /api/oauth/callback
INFO: Created new merchant with id: 550e8400-...
INFO: Generated JWT token
INFO: Sending welcome email (mock)
```

Check if email was logged:

```
INFO: [EmailService] Welcome email sent to merchant@example.com
Subject: Welcome to Member Plus!
Language: ar
```

### 10. Database Verification

Check if merchant was created in SQLite:

```bash
sqlite3 memberplus_phase1.db

# List all merchants
SELECT id, salla_store_id, store_name, merchant_email, trial_start_date, trial_end_date FROM merchants;

# Check trial countdown
SELECT 
  merchant_id, 
  trial_start_date, 
  trial_end_date,
  CAST((julianday(trial_end_date) - julianday('now')) AS INTEGER) as remaining_days
FROM merchants;
```

## Expected Flow Diagram

```
[Browser]                [Frontend]              [Backend API]          [Database]
   |                         |                        |                     |
   |--1. GET /index.html------→                                             
   |←----Login Page HTML-------                                             
   |                                                                          
   |--2. Click "Demo Login"----→                                             
   |                         |                                               
   |                      |--3. GET /api/oauth/callback---→                  
   |                      |                             |                   
   |                      |                          |--4. Check merchant---→
   |                      |                          |←---- Not found        
   |                      |                             |                   
   |                      |                          |--5. Create merchant--→
   |                      |                          |←---- merchant_id     
   |                      |                             |                   
   |                      |                          |--6. Gen JWT token ---|
   |                      |                          |←---- token          
   |                      |                             |                   
   |                      |←-Response w/ token---------                      
   |←--Redirect + token---                                                   
   |                                                                          
   |--7. GET /dashboard.html?token=...--→                                    
   |←--------Dashboard HTML------------                                     
   |                                                                          
   |--8. Fetch /api/merchant/profile--→                                      
   |      (Header: Authorization: Bearer token)                              
   |                      |--9. Validate JWT-------→                         
   |                      |←--Valid, merchant_id---                          
   |                      |--10. Query merchant----→                         
   |                      |←----Profile data------                           
   |←--JSON Response-----------                                              
   |                                                                          
   |--Display Dashboard--------→                                             
```

## Success Criteria

✅ **All tests pass** when:

- [ ] Backend health check responds
- [ ] OAuth callback creates merchant in DB
- [ ] JWT token is valid
- [ ] Profile/Trial/Dashboard APIs return correct data
- [ ] Frontend login page displays correctly
- [ ] Demo login redirects to dashboard
- [ ] Dashboard displays merchant data
- [ ] Language toggle works (AR ↔ EN)
- [ ] Trial countdown shows ~14 days
- [ ] Multiple merchants are isolated
- [ ] Invalid tokens rejected with 401
- [ ] All CORS headers correct

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend port 8000 already in use | `lsof -i :8000` then `kill -9 <PID>` or use different port |
| Frontend port 3000 already in use | `lsof -i :3000` then `kill -9 <PID>` or use different port |
| CORS error in console | Check `allow_origins` in main.py includes frontend URL |
| "Merchant not found" on dashboard | Verify token was saved correctly, check localStorage |
| Database locked | Close other SQLite clients, or use fresh database |
| Email not sent | Phase 1 MVP: email only logged to console, not actually sent |
| Redirect loop | Check if token is being stored/retrieved correctly |

## Cleanup

```bash
# Reset database
rm memberplus_phase1.db

# Clear browser storage
# Open DevTools → Application → Storage → Clear

# Stop servers
# Ctrl+C in both terminals
```

## Next Steps After E2E Testing

1. ✅ Phase 1 MVP complete and tested
2. 🔄 Phase 1 Full: Real Salla OAuth, real email provider, production database
3. 🔄 Phase 2+: Setup wizard, member management, analytics, etc.
