import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    // TheoremReach sends user_id and reward (or coins) in query params
    const userId = req.query.user_id || req.body?.user_id;
    const reward = parseInt(req.query.reward || req.query.coins || req.body?.reward || 0, 10);

    if (!userId || reward <= 0) {
      return res.status(400).send("Invalid parameters");
    }

    const userRef = db.collection("users").doc(userId);
    await userRef.set(
      { coins: admin.firestore.FieldValue.increment(reward) },
      { merge: true }
    );

    return res.status(200).send("1");
  } catch (error) {
    console.error("TheoremReach Webhook Error:", error);
    return res.status(500).send("Server Error");
  }
}
