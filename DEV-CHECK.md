# Development Server Startup Guide & Troubleshooting

## 🚀 Quick Start

### Normal Startup
```bash
npm run dev
```

### Startup with Monitoring (Recommended)
```bash
bash start-dev.sh
```

This will automatically:
- Clean up any existing processes on port 5175
- Start the dev server
- Monitor the server every 30 seconds to confirm it's running

### Manual Monitoring (if server already running)
```bash
npm run dev:monitor
# or
bash test-server.sh 5175
```

---

## 🐛 Common Issues & Solutions

### Issue #1: Port Already in Use

**Symptoms:**
- Server won't start
- Error message about port 5175 being in use
- Blank screen in browser

**Solution:**
```bash
# Kill any process using port 5175
lsof -ti:5175 | xargs kill -9

# Then start the server again
npm run dev
```

**Prevention:**
- Always stop the dev server properly with `Ctrl+C` before closing terminal
- Use `start-dev.sh` script which automatically cleans up ports

---

### Issue #2: Server Starts But Browser Shows Blank Screen

**Symptoms:**
- `npm run dev` appears to run successfully
- Browser shows blank page or connection error
- No clear indication if server is actually responding

**Solution:**
```bash
# Check if server is actually responding
curl http://localhost:5175

# Or use the monitoring script
npm run dev:monitor
```

**What to look for:**
- HTTP 200 response = Server is working ✅
- Connection refused = Server not started ❌
- Port listening but no response = Server starting up ⏳

---

### Issue #3: No Visibility Into Startup Status

**Symptoms:**
- Running `npm run dev` but unsure if it worked
- No feedback about server status
- Don't know if you should wait or troubleshoot

**Solution:**
Use the monitoring scripts that provide clear feedback:
```bash
bash start-dev.sh
```

This will show:
- ✅ Server is running and responding
- ⏳ Port is listening but not responding yet
- ❌ Server did not start after X attempts

---

## 📋 Available Scripts

### `npm run dev`
Starts the Vite development server on port 5175.

### `npm run dev:monitor`
Monitors the server every 30 seconds to verify it's responding.
- Checks up to 20 times (10 minutes total)
- Shows clear status messages
- Exits when server is confirmed running

### `bash start-dev.sh`
Complete startup script that:
1. Cleans up any existing processes on port 5175
2. Starts the dev server in the background
3. Automatically runs monitoring
4. Shows server logs

### `bash test-server.sh [PORT]`
Health check script (default port: 5175)
- Checks every 30 seconds
- Verifies port is listening
- Verifies HTTP response is 200
- Maximum 20 attempts

### `bash check-server.sh [PORT]`
Basic server health check (default port: 5174)
- Similar to test-server.sh but with different defaults

---

## 🔍 Troubleshooting Checklist

When the application won't start, go through this checklist:

### Step 1: Check if Port is in Use
```bash
lsof -i :5175
```

If you see processes listed:
```bash
# Kill the process
lsof -ti:5175 | xargs kill -9
```

### Step 2: Check if Server is Running
```bash
curl http://localhost:5175
```

Expected: HTML response or 200 status code

### Step 3: Check Server Logs
```bash
# If using start-dev.sh, logs are in:
cat /tmp/vite-dev-server.log

# Or check npm output directly
npm run dev
```

### Step 4: Verify Dependencies
```bash
npm install
```

### Step 5: Check Node Version
```bash
node --version
```

Should be compatible with your project (check `package.json` for engine requirements)

---

## 🎯 Server Configuration

The dev server is configured in `vite.config.ts`:
- **Port:** 5175
- **Host:** true (accessible from network)
- **Strict Port:** false (will try next port if 5175 is in use)

If port 5175 is unavailable, Vite will automatically try 5176, 5177, etc.

---

## 📝 Monitoring Script Details

The monitoring scripts check:
1. **Port Status:** Is something listening on the port?
2. **HTTP Response:** Does the server respond with HTTP 200?
3. **Timing:** Checks every 30 seconds, up to 20 attempts (10 minutes)

**Success Criteria:**
- Port is listening ✅
- HTTP response is 200 ✅
- Server is ready! 🎉

**Failure Indicators:**
- Port not listening after 10 minutes
- Port listening but HTTP response not 200
- Connection refused errors

---

## 💡 Best Practices

1. **Always use `start-dev.sh`** for guaranteed clean startup
2. **Monitor the first startup** to catch issues early
3. **Check logs** if something seems wrong
4. **Kill processes properly** before closing terminal (Ctrl+C)
5. **Use monitoring scripts** when unsure if server is running

---

## 🆘 Still Having Issues?

If none of the above solutions work:

1. **Check for other Node processes:**
   ```bash
   ps aux | grep node
   ```

2. **Kill all Node processes (nuclear option):**
   ```bash
   pkill -9 node
   ```

3. **Restart your terminal/IDE**

4. **Check system resources:**
   ```bash
   # Check available ports
   netstat -an | grep LISTEN | grep 517
   ```

5. **Verify project files:**
   ```bash
   # Check if vite.config.ts exists and is valid
   cat vite.config.ts
   
   # Check package.json
   cat package.json
   ```

---

## 📚 Additional Resources

- Vite Documentation: https://vitejs.dev/
- Port troubleshooting: Use `lsof -i :PORT` to find processes
- Server logs: Check `/tmp/vite-dev-server.log` when using start-dev.sh

---

**Last Updated:** $(date)
**Server Port:** 5175
**Monitoring Interval:** 30 seconds
**Max Monitoring Attempts:** 20 (10 minutes total)

