source /home2/totomk/.env.mamaljubinka

# sanitize variables
for var in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID FIREBASE_STORAGE_BUCKET FIREBASE_MESSAGING_SENDER_ID FIREBASE_APP_ID; do
  eval "$var=\"\$(echo \${$var} | tr -d '\r\n')\""
done

TARGET_DIR="/home2/totomk/public_html/mamaljubinkafinances.toto.mk"

mkdir -p "$TARGET_DIR/js"

rm -f "$TARGET_DIR/js/firebase-config.js"

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

echo "firebase-config.js generated successfully at $TARGET_DIR/js/firebase-config.js"
