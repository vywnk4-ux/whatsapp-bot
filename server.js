const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Webhook running ✅"));
app.get("/health", (req, res) => res.status(200).send("OK"));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("VERIFY HIT:", { mode, tokenOk: token === process.env.VERIFY_TOKEN });

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified ✅");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  // رجّع 200 بسرعة عشان ميتا ما تعيد الإرسال
  res.sendStatus(200);

  try {
    console.log("INCOMING BODY:", JSON.stringify(req.body, null, 2));

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("No message (maybe status update).");
      return;
    }

    const from = message.from;
    const userText = message?.text?.body || "";
    console.log("FROM:", from, "TEXT:", userText);

    const replyText = userText ? `✅ استلمت: ${userText}` : "✅ وصلت الرسالة";
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

    const txt = await resp.text();
    console.log("SEND RESP STATUS:", resp.status);
    console.log("SEND RESP BODY:", txt);
  } catch (e) {
    console.error("WEBHOOK ERROR:", e?.message || e);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
