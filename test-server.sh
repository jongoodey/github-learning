#!/bin/bash

# Server startup and monitoring script
# Checks every 30 seconds if the server is responding

PORT=${1:-5175}
MAX_ATTEMPTS=20
ATTEMPT=0

echo "🚀 Starting development server on port $PORT..."
echo "📊 Monitoring server startup (checking every 30 seconds)..."
echo ""

# Kill any existing processes on the port
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Start the server in the background
cd "$(dirname "$0")"
npm run dev -- --port $PORT > /tmp/vite-server.log 2>&1 &
SERVER_PID=$!

echo "Server process started with PID: $SERVER_PID"
echo "Logs are being written to: /tmp/vite-server.log"
echo ""

# Function to check if server is responding
check_server() {
    local url="http://localhost:$PORT"
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Monitor the server
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "[$(date +'%H:%M:%S')] Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking server..."
    
    if check_server; then
        echo ""
        echo "✅ SUCCESS! Server is responding on http://localhost:$PORT"
        echo "📝 Last 10 lines of server log:"
        echo "----------------------------------------"
        tail -10 /tmp/vite-server.log
        echo "----------------------------------------"
        echo ""
        echo "🌐 Server is ready! Open http://localhost:$PORT in your browser"
        exit 0
    else
        echo "   ⏳ Server not ready yet, waiting 30 seconds..."
        sleep 30
    fi
done

echo ""
echo "❌ FAILED: Server did not start after $MAX_ATTEMPTS attempts"
echo "📝 Server log:"
echo "----------------------------------------"
cat /tmp/vite-server.log
echo "----------------------------------------"
echo ""
echo "Killing server process..."
kill $SERVER_PID 2>/dev/null || true
exit 1

