// server.js (CommonJS)
// WhatsApp Cloud API Webhook (Render)

const express = require("express");
const app = express();

app.use(express.json());

// الصفحة الرئيسية (اختياري)
app.get("/", (req, res) => {
  res.send("Webhook running ✅");
});

// ✅ Verify Webhook (Meta) - GET /webhook
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

// ✅ Receive Messages - POST /webhook
app.post("/webhook", async (req, res) => {
  // مهم جداً: رجّع 200 فوراً قبل أي شغل
  res.sendStatus(200);

  try {
    const body = req.body;

    // تأكد انه حدث واتساب صحيح
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // إذا ما فيه رسائل (مثلاً status updates) تجاهله
    const msg = value?.messages?.[0];
    if (!msg) return;

    const from = msg.from; // رقم المرسل بصيغة دولية بدون +
    const type = msg.type;

    // نص المستخدم (إذا كانت رسالة نص)
    let userText = "";
    if (type === "text") {
      userText = msg.text?.body || "";
    } else {
      userText = `[${type}]`;
    }

    console.log("Incoming message ✅", { from, type, userText });

    // الرد التلقائي
    const replyText =
      userText && userText.trim().length > 0
        ? `✅ وصلني: ${userText}`
        : "✅ وصلت";

    // إرسال الرد عبر Cloud API
    const url = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: from,
      text: { body: replyText },
    };

    // Node 18+ فيه fetch جاهز
    if (typeof fetch !== "function") {
      console.error("❌ fetch غير موجود. لازم Node 18+ على Render");
      return;
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.text();
    console.log("Send message response:", data);
  } catch (err) {
    console.error("Reply error:", err);
  }
});

// ✅ Render uses PORT env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
