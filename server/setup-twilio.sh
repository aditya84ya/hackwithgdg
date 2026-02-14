# Load credentials from .env
if [ -f .env ]; then
  echo "Loading configuration from .env..."
  set -a
  source .env
  set +a
else
  echo "❌ Error: .env file not found in current directory."
  exit 1
fi

echo "🔧 Configuring Twilio credentials in Ultravox..."
echo ""

# Make the API call to set telephony config
response=$(curl -s -X PATCH \
  "https://api.ultravox.ai/api/accounts/me/telephony_config" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ULTRAVOX_API_KEY" \
  -d "{
    \"twilio\": {
      \"accountSid\": \"$TWILIO_ACCOUNT_SID\",
      \"authToken\": \"$TWILIO_AUTH_TOKEN\"
    }
  }")

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""

# Check if successful
if echo "$response" | grep -q "accountSid"; then
  echo "✅ SUCCESS! Twilio is now configured in your Ultravox account."
  echo ""
  echo "Next steps:"
  echo "  1. Make sure your Twilio phone number is set in server/.env"
  echo "  2. Restart your server: npm run dev"
  echo "  3. Try making a call from the Call Center!"
else
  echo "❌ ERROR: Something went wrong. Check your API keys."
fi
