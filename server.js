// server.js
const express = require("express");
const app = express();

app.use(express.json());

// صفحة اختبار
app.get("/", (req, res) => {
  res.send("Webhook running ✅");
});


// ✅ تحقق Webhook من Meta
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified ✅");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});


// ✅ استقبال الرسائل والرد عليها
app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming:", JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const userText = message.text?.body || "";

    console.log("User said:", userText);

    const replyText = userText
      ? `✅ استلمت: ${userText}`
      : "✅ وصلت الرسالة";

    const url = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: from,
        text: { body: replyText },
      }),
    });

    const data = await resp.text();
    console.log("Send message response:", data);

  } catch (err) {
    console.error("Reply error:", err);
  }

  res.sendStatus(200);
});


// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
