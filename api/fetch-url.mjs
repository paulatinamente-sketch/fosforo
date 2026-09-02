export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(404).json({ error: "Solo se soporta POST" });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Falta la URL." });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "URL no válida." });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FosforoBot/1.0)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `La página respondió con estado ${response.status}.` });
    }

    const html = await response.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const limited = text.slice(0, 8000);

    return res.status(200).json({ text: limited });
  } catch (e) {
    return res.status(502).json({ error: "No se pudo acceder a la URL. Verificá que sea pública y accesible." });
  }
}
