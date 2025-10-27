#!/bin/bash
# =====================================================
# cPanel Deploy Script for Mama Ljubinka Finances
# Safely generates firebase-config.js from .env file
# =====================================================

# Load environment variables from your private .env file
source /home2/totomk/.env.mamaljubinka

# Target directory (your live site folder)
TARGET_DIR="/home2/totomk/public_html/mamaljubinkafinances.toto.mk"

# Helper: safely quote any variable for JS using jq (handles \r, \n, quotes)
js_string() {
  printf '%s' "$1" | jq -Rr @json
}

# Generate JSON-safe strings
API_KEY=$(js_string "$FIREBASE_API_KEY")
AUTH_DOMAIN=$(js_string "$FIREBASE_AUTH_DOMAIN")
PROJECT_ID=$(js_string "$FIREBASE_PROJECT_ID")
STORAGE_BUCKET=$(js_string "$FIREBASE_STORAGE_BUCKET")
MSG_SENDER_ID=$(js_string "$FIREBASE_MESSAGING_SENDER_ID")
APP_ID=$(js_string "$FIREBASE_APP_ID")

# Create firebase-config.js
printf '%s\n' "import { initializeApp } from \"https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js\";" > "$TARGET_DIR/firebase-config.js"
printf '%s\n' "import { getFirestore } from \"https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js\";" >> "$TARGET_DIR/firebase-config.js"
printf '%s\n' "import { getAuth } from \"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js\";" >> "$TARGET_DIR/firebase-config.js"
printf '\n%s\n' "const firebaseConfig = {" >> "$TARGET_DIR/firebase-config.js"
printf '  apiKey: %s,\n' "$API_KEY" >> "$TARGET_DIR/firebase-config.js"
printf '  authDomain: %s,\n' "$AUTH_DOMAIN" >> "$TARGET_DIR/firebase-config.js"
printf '  projectId: %s,\n' "$PROJECT_ID" >> "$TARGET_DIR/firebase-config.js"
printf '  storageBucket: %s,\n' "$STORAGE_BUCKET" >> "$TARGET_DIR/firebase-config.js"
printf '  messagingSenderId: %s,\n' "$MSG_SENDER_ID" >> "$TARGET_DIR/firebase-config.js"
printf '  appId: %s\n' "$APP_ID" >> "$TARGET_DIR/firebase-config.js"
printf '%s\n' "};" >> "$TARGET_DIR/firebase-config.js"
printf '\n%s\n' "const app = initializeApp(firebaseConfig);" >> "$TARGET_DIR/firebase-config.js"
printf '%s\n' "export const db = getFirestore(app);" >> "$TARGET_DIR/firebase-config.js"
printf '%s\n' "export const auth = getAuth(app);" >> "$TARGET_DIR/firebase-config.js"

echo "✅ firebase-config.js generated successfully at $TARGET_DIR"
