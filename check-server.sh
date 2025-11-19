#!/bin/bash

# Server health check script
# Checks every 30 seconds if the dev server is running and responding

PORT=${1:-5174}
MAX_ATTEMPTS=20
ATTEMPT=0

echo "🔍 Monitoring dev server on port $PORT..."
echo "Checking every 30 seconds..."
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Check if port is listening
    if lsof -i :$PORT > /dev/null 2>&1; then
        # Check if server responds
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ Server is running and responding on http://localhost:$PORT"
            echo "   HTTP Status: $HTTP_CODE"
            echo "   Attempt: $ATTEMPT/$MAX_ATTEMPTS"
            exit 0
        else
            echo "⏳ Port $PORT is listening but not responding yet (HTTP $HTTP_CODE)..."
            echo "   Attempt: $ATTEMPT/$MAX_ATTEMPTS"
        fi
    else
        echo "⏳ Port $PORT is not listening yet..."
        echo "   Attempt: $ATTEMPT/$MAX_ATTEMPTS"
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 30
    fi
done

echo "❌ Server did not start after $MAX_ATTEMPTS attempts"
exit 1

