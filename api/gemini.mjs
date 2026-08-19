// Función serverless de Vercel: recibe la petición del frontend y la reenvía
// a Gemini con la clave guardada del lado del servidor.
// Así la clave NUNCA queda expuesta en el navegador.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(404).json({ error: { message: "Solo se soporta POST" } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "Falta GEMINI_API_KEY en las variables de entorno de Vercel." } });
  }

  const { modelo, payload } = req.body || {};
  if (!modelo || !payload) {
    return res.status(400).json({ error: { message: "Faltan modelo o payload." } });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: { message: "No se pudo contactar Gemini." } });
  }
}