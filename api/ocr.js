export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.GOOGLE_API_KEY;
  if (!key) return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: "Missing image data" });

  const base64 = image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    });
    const data = await r.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const fullAnnotation = data.responses?.[0]?.fullTextAnnotation;
    if (!fullAnnotation) {
      return res.status(200).json({ text: "", lines: [] });
    }

    const fullText = fullAnnotation.text;

    // Extract lines with bounding boxes
    const lines = [];
    for (const page of fullAnnotation.pages || []) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          let lineWords = [];
          let lastY = null;

          for (const word of paragraph.words || []) {
            const wordText = word.symbols.map((s) => {
              let ch = s.text;
              const brk = s.property?.detectedBreak?.type;
              if (brk === "SPACE" || brk === "SURE_SPACE") ch += " ";
              if (brk === "EOL_SURE_SPACE" || brk === "LINE_BREAK") ch += "\n";
              return ch;
            }).join("");

            const verts = word.boundingBox?.vertices;
            const wordY = verts ? (verts[0].y + verts[2].y) / 2 : 0;
            const wordHeight = verts ? Math.abs(verts[2].y - verts[0].y) : 20;

            if (lastY !== null && Math.abs(wordY - lastY) > wordHeight * 0.5 && lineWords.length > 0) {
              lines.push(buildLine(lineWords));
              lineWords = [];
            }

            lineWords.push({ text: wordText, vertices: verts });
            lastY = wordY;
          }

          if (lineWords.length > 0) {
            lines.push(buildLine(lineWords));
          }
        }
      }
    }

    res.status(200).json({ text: fullText, lines });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function buildLine(words) {
  const text = words.map((w) => w.text).join("").trim();
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  for (const w of words) {
    if (!w.vertices) continue;
    for (const v of w.vertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
    }
  }
  return {
    text,
    bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
  };
}
