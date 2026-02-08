const express = require("express");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Webhook running ✅"));
app.get("/health", (req, res) => res.status(200).send("OK"));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const userText = message.text?.body || "";
    const replyText = userText ? `✅ استلمت: ${userText}` : "✅ وصلت الرسالة";

    const url = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;

    await fetch(url, {
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
  } catch (e) {}
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});
