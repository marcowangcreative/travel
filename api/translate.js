export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.GOOGLE_API_KEY;
  if (!key) return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });

  const { text, target, source } = req.body;
  if (!text || !target) return res.status(400).json({ error: "Missing text or target" });

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        target,
        source: source || "",
        format: "text",
      }),
    });
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const translated = data.data.translations[0].translatedText;
    const detected = data.data.translations[0].detectedSourceLanguage || source;
    res.status(200).json({ translated, detected });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
