const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  try {
    const userId = req.query.user_id || (req.body && req.body.user_id);
    const reward = parseInt(req.query.reward || req.query.coins || (req.body && req.body.reward) || 0, 10);

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
    console.error("Webhook Error:", error);
    return res.status(500).send("Error: " + error.message);
  }
};
