#!/bin/bash
# =====================================================
# cPanel Deploy Script for Mama Ljubinka Finances
# Generates firebase-config.js securely from .env file
# =====================================================

# Load your private environment file
source /home2/totomk/.env.mamaljubinka

# Define the target directory
TARGET_DIR="/home2/totomk/public_html/mamaljubinkafinances.toto.mk"

# Create firebase-config.js directly with substituted values
cat > "$TARGET_DIR/js/firebase-config.js" <<EOF
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "${FIREBASE_AUTH_DOMAIN}",
  projectId: "${FIREBASE_PROJECT_ID}",
  storageBucket: "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${FIREBASE_APP_ID}"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
EOF

echo "✅ firebase-config.js generated successfully at $TARGET_DIR"
