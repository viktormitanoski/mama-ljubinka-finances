#!/bin/bash
# =====================================================
# cPanel Deploy Script for Mama Ljubinka Finances
# Generates firebase-config.js securely from .env file
# =====================================================

# Load environment variables from private file
source /home2/totomk/.env.mamaljubinka

# Target directory (your public_html path)
TARGET_DIR="/home2/totomk/public_html/mamaljubinkafinances.toto.mk"

# Generate firebase-config.js safely
cat > "$TARGET_DIR/js/firebase-config.js" <<'EOF'
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "__API_KEY__",
  authDomain: "__AUTH_DOMAIN__",
  projectId: "__PROJECT_ID__",
  storageBucket: "__STORAGE_BUCKET__",
  messagingSenderId: "__MSG_SENDER_ID__",
  appId: "__APP_ID__"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
EOF

# Replace placeholders with actual env vars (this prevents quote breakage)
sed -i "s|__API_KEY__|${FIREBASE_API_KEY}|g" "$TARGET_DIR/firebase-config.js"
sed -i "s|__AUTH_DOMAIN__|${FIREBASE_AUTH_DOMAIN}|g" "$TARGET_DIR/firebase-config.js"
sed -i "s|__PROJECT_ID__|${FIREBASE_PROJECT_ID}|g" "$TARGET_DIR/firebase-config.js"
sed -i "s|__STORAGE_BUCKET__|${FIREBASE_STORAGE_BUCKET}|g" "$TARGET_DIR/firebase-config.js"
sed -i "s|__MSG_SENDER_ID__|${FIREBASE_MESSAGING_SENDER_ID}|g" "$TARGET_DIR/firebase-config.js"
sed -i "s|__APP_ID__|${FIREBASE_APP_ID}|g" "$TARGET_DIR/firebase-config.js"

echo "✅ firebase-config.js generated successfully at $TARGET_DIR"
