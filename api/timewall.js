import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const query = req.query;
    const { userid, txid, currency, type, signature } = query;

    if (!userid || !currency || !signature) {
      return res.status(400).send("Missing parameters");
    }

    const secretKey = "78c7a941fc39d338351dcde06279d13a";
    const sortedKeys = Object.keys(query)
      .filter((k) => k !== "signature")
      .sort();

    let rawString = "";
    for (const k of sortedKeys) {
      rawString += k + query[k];
    }

    const expectedSig = crypto
      .createHmac("sha256", secretKey)
      .update(rawString)
      .digest("hex");

    if (expectedSig !== signature.toLowerCase()) {
      return res.status(403).send("Invalid signature");
    }

    const txRef = db.collection("transactions").doc(`tw_${txid}`);
    const txSnap = await txRef.get();
    if (txSnap.exists) {
      return res.status(200).send("OK");
    }

    const coins = Math.round(parseFloat(currency));
    if (coins > 0 && type !== "hold_cancelled") {
      await db.collection("users").doc(userid).set(
        { coins: admin.firestore.FieldValue.increment(coins) },
        { merge: true }
      );
      await txRef.set({
        userid,
        coins,
        source: "TimeWall",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("TimeWall Postback Error:", err);
    return res.status(500).send("Server Error");
  }
}
