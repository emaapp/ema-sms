import express from "express";
import bodyParser from "body-parser";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Firebase setup
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY || "{}");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://project-ema-998cd-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}
const db = admin.database();

// Root test
app.get("/", (req, res) => {
  res.send("EMA SMS Backend Running ✅");
});

// Handle SMS
app.post("/sms", async (req, res) => {
  try {
    const message = req.body.message || "";
    const from = req.body.from || "unknown";

    let reply = "Sorry, could not understand your request.";

    if (message.toUpperCase().startsWith("EMA ")) {
      const district = message.split(" ")[1];
      if (district) {
        const snap = await db.ref("reports/sightings").orderByChild("district").equalTo(district).limitToLast(1).once("value");
        if (snap.exists()) {
          const report = Object.values(snap.val())[0];
          reply = `Latest ${district} report: ${report.elephants} elephants, Danger: ${report.danger}`;
        } else {
          reply = `No reports found for ${district}`;
        }
      }
    }

    res.json({
      success: true,
      reply,
    });
  } catch (e) {
    console.error(e);
    res.json({ success: false, reply: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
