import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `Sos un evaluador experto en selección de personal con más de 30 años de experiencia en RR.HH. Tu tarea es comparar la descripción de un puesto de trabajo con el CV de un candidato y devolver ÚNICAMENTE un objeto JSON (sin texto adicional, sin markdown, sin bloques de código) con esta estructura exacta:

{
  "seniority_puesto": "junior" | "semi senior" | "senior",
  "puntaje_match": <número entero de 0 a 100>,
  "coincidencias_fuertes": [{"item": "string muy corto", "explicacion": "string breve, máx 12 palabras"}],
  "coincidencias_parciales": [{"item": "string muy corto", "explicacion": "string breve, máx 12 palabras"}],
  "faltantes": [{"item": "string muy corto", "explicacion": "string breve, máx 12 palabras"}],
  "sugerencia": "string, 1 oración corta",
  "nota_transparencia": "string, 1 oración corta",
  "cv_texto_extraido": "string: resumen del CV en viñetas cortas"
}

IMPORTANTE — SÉ MUY CONCISO EN TODA LA RESPUESTA. Tu respuesta tiene un límite estricto de longitud. Si te extendés demasiado, la respuesta se corta y queda inválida. Por eso:
- Máximo 4 ítems por lista (coincidencias_fuertes, coincidencias_parciales, faltantes), solo los más relevantes.
- Cada "explicacion" va en máximo 12 palabras.
- "cv_texto_extraido" NO es una transcripción palabra por palabra del CV: es un resumen en viñetas cortas (una línea por experiencia laboral con puesto/empresa/2-3 tareas clave, y una línea para formación y otra para habilidades). Cada viñeta empieza con "• " y va SEPARADA POR UN SALTO DE LÍNEA (\n) de la siguiente — nunca todas seguidas en un mismo párrafo. Priorizá que esté completo el resto del JSON antes que este campo sea extenso.

Muy importante sobre el tono: todo el texto que escribas en "explicacion", "sugerencia" y "nota_transparencia" tiene que hablarle DIRECTAMENTE al candidato, en segunda persona ("vos", "tenés", "te falta", "podrías sumar"). Nunca escribas en tercera persona ("el candidato", "la persona"). Quien lee esto es el candidato mismo, evaluando si le conviene postularse.

El puesto y/o el CV pueden llegar como una o varias imágenes (por ejemplo capturas de pantalla, o las páginas de un CV de varias hojas). Si es así, leé con atención TODO el texto visible en cada una de las imágenes antes de aplicar las reglas siguientes — tratá todas las imágenes de un mismo documento como partes de un solo texto continuo, no evalúes cada imagen por separado.

Reglas de evaluación (seguilas estrictamente):
1. Clasificá el puesto como junior, semi senior o senior SOLO en base al CONTENIDO real de la publicación (años de experiencia pedidos, nivel de autonomía, complejidad de las responsabilidades, gente a cargo o no) — nunca en base al perfil del candidato, y nunca en base a la palabra "Senior/Junior/Semi Senior" que pueda aparecer en el título del puesto. Los títulos suelen estar inflados (títulos que dicen "Senior" para posiciones que en su contenido son operativas o sin gente a cargo) — ignorá esa etiqueta y analizá exclusivamente lo que el aviso pide hacer y con qué experiencia. Si el contenido no sustenta la etiqueta del título, primá el contenido.
2. Identificá primero cuáles son las 2-4 tareas o responsabilidades CENTRALES del puesto (el corazón de lo que hay que saber hacer) y cuáles son secundarias o deseables. Esta distinción es crítica para todo lo que sigue.
3. Comparás tareas y responsabilidades CONCRETAS entre el CV y el puesto, priorizando el contenido de lo que la persona hizo por sobre el nombre del cargo que tuvo. Dos puestos con nombres distintos pueden implicar exactamente las mismas tareas — reconocé esa equivalencia.
4. Ponderá según el seniority detectado: si es senior, dale más peso a la experiencia en tareas/responsabilidades similares; si es junior, dale más peso a las herramientas y conocimientos técnicos; si es semi senior, ponderá ambos de forma equilibrada.
5. Clasificá cada requisito relevante del puesto en una de tres categorías:
   - Coincidencia fuerte: cumplís el requisito de forma clara y directa.
   - Coincidencia parcial: cumplís el requisito en espíritu pero no en el detalle exacto (ej: piden liderar equipos de 10+ personas y lideraste equipos de 5 — no hay contexto suficiente para descartarlo, así que es parcial, no faltante).
   - Faltante: no hay evidencia en el CV de ese requisito. Priorizá que los faltantes CENTRALES (los del punto 2) siempre queden reflejados en la lista, aunque tengas que dejar afuera algún requisito secundario por el límite de ítems.
6. El nombre del puesto anterior se usa solo como señal secundaria, nunca como filtro determinante.
7. En "sugerencia": si el candidato SÍ tiene la experiencia central pero no la visibiliza bien, sugerí cómo destacarla mejor (nunca inventar experiencia que no tiene). Pero si falta experiencia en una tarea central, decilo con total honestidad en la sugerencia — no lo disimules ni lo suavices de más.
8. En "nota_transparencia", aclará en una oración corta que esta evaluación NO considera edad, género, ubicación geográfica, lugar de estudios ni otros factores ajenos a tareas, responsabilidades, habilidades y experiencia relevante.
9. "puntaje_match" — REGLA DURA: si al candidato le falta experiencia directa en una o más tareas CENTRALES del puesto (las del punto 2), el puntaje NO PUEDE superar 40, sin importar cuántas coincidencias secundarias (herramientas, habilidades blandas, formación) tenga. Recién si cumple las tareas centrales, las coincidencias secundarias pueden subir el puntaje por encima de eso. Sé estricta: es mejor un puntaje bajo honesto que uno generoso que no sirve para decidir si postularse.

Devolvé SOLO el JSON, nada de texto antes o después.`;

const BRAND = {
  ink: "#110A9F",
  lavender: "#E3E2FD",
  slate: "#6A74A0",
  stone: "#BFBEB0",
  paper: "#FBFBFD",
  text: "#1B1A33",
  textMuted: "#5B5A78",
};

const CATEGORY_STYLES = {
  fuertes: { bg: BRAND.lavender, border: BRAND.ink, dot: BRAND.ink, label: "Coincidencias fuertes" },
  parciales: { bg: "#EDEDF6", border: BRAND.slate, dot: BRAND.slate, label: "Coincidencias parciales" },
  faltantes: { bg: "#F5EFE9", border: "#A85039", dot: "#A85039", label: "Faltantes" },
};

const MENSAJES_CARGA = [
  "Leyendo entre líneas...",
  "Comparando tareas y responsabilidades...",
  "Buscando coincidencias ocultas...",
  "Ponderando según el seniority del puesto...",
  "Afinando el puntaje...",
];

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELOS_GEMINI = ["gemini-3.6-flash", "gemini-3.1-flash", "gemini-2.5-flash-lite"];
const MAX_TOKENS = 4096;
const GEMINI_PROXY_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_PROXY_URL) || "";

function getApiKey() {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof window !== "undefined" && window.GEMINI_API_KEY) {
    return window.GEMINI_API_KEY;
  }
  return "";
}

function mensajeError(e) {
  switch (e?.message) {
    case "FALTA_API_KEY":
      return "Falta configurar la clave de Gemini. Para probar en local ponela en tu .env como VITE_GEMINI_API_KEY=tu-clave (gratis en https://aistudio.google.com/apikey). En Vercel usá GEMINI_API_KEY + VITE_GEMINI_PROXY_URL=/api/gemini.";
    case "CLAVE_INVALIDA":
      return "La clave de Gemini no es válida. Revisala (debe empezar con AIza...).";
    case "LIMITE_CUOTA":
      return "Se alcanzó la cuota gratuita de Gemini por el momento. Probá de nuevo en unos minutos o mañana.";
    case "DEMANDA_ALTA":
      return "Gemini está con mucha demanda ahora mismo. Esperá unos segundos y volvé a tocar Evaluar match.";
    case "SIN_CONEXION":
      return "No hay conexión con el servicio. Revisá tu internet e intentá de nuevo.";
    default:
      if (e?.message && e.message.startsWith("API:")) {
        return `El servicio respondió un error: ${e.message.slice(4)}`;
      }
      if (e?.message && e.message.startsWith("PARSE:")) {
        return `Gemini respondió algo que no se pudo leer como resultado válido. Probá de nuevo. Si sigue, copiá este detalle: ${e.message.slice(6)}`;
      }
      if (e?.message === "RESPUESTA_VACIA") {
        return "Gemini respondió vacío. Probá de nuevo; suele pasar cuando hay mucha demanda.";
      }
      return "No se pudo evaluar el match. Revisá que las imágenes estén bien cargadas e intentá de nuevo.";
  }
}

function useBrandFonts() {
  useEffect(() => {
    const id = "brand-fonts-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function ScannerLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % MENSAJES_CARGA.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 0" }}>
      <style>{`
        @keyframes scanmove { 0% { transform: translateX(-34px) translateY(-6px) rotate(-8deg); } 50% { transform: translateX(34px) translateY(6px) rotate(-8deg); } 100% { transform: translateX(-34px) translateY(-6px) rotate(-8deg); } }
        @keyframes linepulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      `}</style>
      <div style={{ position: "relative", width: 140, height: 90 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10 }}>
          {[100, 70, 85, 55].map((w, i) => (
            <div
              key={i}
              style={{
                height: 7,
                width: `${w}%`,
                borderRadius: 4,
                background: BRAND.stone,
                animation: `linepulse 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", top: 4, left: "50%", animation: "scanmove 1.8s ease-in-out infinite" }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <circle cx="14" cy="14" r="10" stroke={BRAND.ink} strokeWidth="3" fill={`${BRAND.ink}22`} />
            <line x1="21.5" y1="21.5" x2="30" y2="30" stroke={BRAND.ink} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 500, color: BRAND.slate, minHeight: 18 }}>
        {MENSAJES_CARGA[msgIndex]}
      </div>
    </div>
  );
}

function ScoreStamp({ score }) {
  const angle = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      style={{
        width: 132,
        height: 132,
        borderRadius: "50%",
        background: `conic-gradient(${BRAND.ink} ${angle}deg, ${BRAND.lavender} ${angle}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: "rotate(-3deg)",
      }}
    >
      <div
        style={{
          width: 106,
          height: 106,
          borderRadius: "50%",
          background: BRAND.paper,
          border: `2px dashed ${BRAND.ink}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 800, color: BRAND.text }}>
          {score}%
        </span>
        <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 10, letterSpacing: 1, color: BRAND.textMuted, textTransform: "uppercase" }}>
          match
        </span>
      </div>
    </div>
  );
}

function ResultList({ kind, items }) {
  const s = CATEGORY_STYLES[kind];
  const hasItems = items && items.length > 0;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}33`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: s.border, fontWeight: 600, marginBottom: hasItems ? 10 : 4 }}>
        {s.label}{hasItems ? ` (${items.length})` : ""}
      </div>
      {!hasItems && (
        <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, color: BRAND.textMuted }}>Sin ítems en esta categoría.</div>
      )}
      {hasItems && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 13.5, fontWeight: 600, color: BRAND.text }}>{it.item}</div>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, color: BRAND.textMuted, marginTop: 1 }}>{it.explicacion}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fileToImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const [header, base64] = result.split(",");
      const mediaType = header.match(/data:(.*);base64/)?.[1] || file.type || "image/png";
      const id = `${file.name || "captura"}-${Date.now()}-${Math.random()}`;
      const imagen = new Image();
      imagen.onload = () => {
        const MAX_LADO = 2200;
        const escala = Math.min(1, MAX_LADO / Math.max(imagen.width, imagen.height));
        if (escala >= 1) {
          resolve({ dataUrl: result, base64, mediaType, id });
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagen.width * escala);
        canvas.height = Math.round(imagen.height * escala);
        canvas.getContext("2d").drawImage(imagen, 0, 0, canvas.width, canvas.height);
        const jpeg = canvas.toDataURL("image/jpeg", 0.85);
        const [h2, b2] = jpeg.split(",");
        const mt = h2.match(/data:(.*);base64/)?.[1] || "image/jpeg";
        resolve({ dataUrl: jpeg, base64: b2, mediaType: mt, id });
      };
      imagen.onerror = () => resolve({ dataUrl: result, base64, mediaType, id });
      imagen.src = result;
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

function InputPanel({ label, panel, setPanel, hint }) {
  const fileInputRef = useRef(null);

  async function handleFiles(files) {
    const nuevos = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (nuevos.length === 0) return;
    const imagenes = await Promise.all(nuevos.map(fileToImageData));
    setPanel((p) => ({ ...p, images: [...p.images, ...imagenes] }));
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      handleFiles(files);
      e.preventDefault();
    }
  }

  function quitarImagen(id) {
    setPanel((p) => ({ ...p, images: p.images.filter((im) => im.id !== id) }));
  }

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <label style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, fontWeight: 600, color: BRAND.text }}>
          {label}
        </label>
      </div>
      <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 11.5, color: BRAND.textMuted, marginBottom: 6, height: 32, lineHeight: "16px" }}>
        {hint || "\u00A0"}
      </div>

      <div
        onPaste={handlePaste}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        tabIndex={0}
        style={{
          width: "100%",
          minHeight: 220,
          borderRadius: 8,
          border: `1.5px dashed ${BRAND.stone}`,
          background: "#FFFFFF",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          padding: 10,
          gap: 8,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {panel.images.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              textAlign: "center",
              fontFamily: "Poppins, sans-serif",
              color: BRAND.textMuted,
              fontSize: 12.5,
              lineHeight: 1.6,
              minHeight: 198,
            }}
          >
            <div>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🖼️</div>
              Pegá una o más capturas (Ctrl+V), arrastralas acá,
              <br />o hacé clic para elegir archivos
            </div>
          </div>
        )}

        {panel.images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {panel.images.map((im, i) => (
              <div key={im.id} style={{ position: "relative", width: 84, height: 84 }}>
                <img
                  src={im.dataUrl}
                  alt={`página ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: `1px solid ${BRAND.stone}` }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 3,
                    left: 3,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    background: "rgba(27,26,51,0.75)",
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  {i + 1}
                </span>
                <button
                  onClick={() => quitarImagen(im.id)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "none",
                    background: BRAND.text,
                    color: "#FFFFFF",
                    fontSize: 11,
                    lineHeight: "18px",
                    textAlign: "center",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 84,
                height: 84,
                borderRadius: 6,
                border: `1.5px dashed ${BRAND.stone}`,
                background: "transparent",
                color: BRAND.textMuted,
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              + agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const emptyPanel = () => ({ images: [] });

export default function MatchCV() {
  useBrandFonts();

  const [puesto, setPuesto] = useState(emptyPanel);
  const [cv, setCv] = useState(emptyPanel);
  const [loading, setLoading] = useState(false);
  const [reevaluando, setReevaluando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [puntajeAnterior, setPuntajeAnterior] = useState(null);
  const [cvEditable, setCvEditable] = useState("");
  const [ultimoPuestoBloques, setUltimoPuestoBloques] = useState(null);
  const [vecesReeditado, setVecesReeditado] = useState(0);
  const [copiado, setCopiado] = useState(false);

  const loaderRef = useRef(null);
  const resultadoRef = useRef(null);
  const errorRef = useRef(null);
  const cvTextareaRef = useRef(null);

  useEffect(() => {
    if (loading || reevaluando) {
      loaderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, reevaluando]);

  useEffect(() => {
    if (resultado && !loading && !reevaluando) {
      resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultado]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const puestoListo = puesto.images.length > 0;
  const cvListo = cv.images.length > 0;
  const puedeEvaluar = puestoListo && cvListo && !loading;
  const hayAlgoParaLimpiar = puesto.images.length > 0 || cv.images.length > 0 || resultado;

  function bloquesDe(panel, etiqueta) {
    const nota = panel.images.length > 1
      ? `${etiqueta} (${panel.images.length} imágenes adjuntas, en orden — tratalas como un solo documento continuo):`
      : `${etiqueta} (imagen adjunta):`;
    return [
      { type: "text", text: nota },
      ...panel.images.map((im) => ({
        type: "image",
        source: { type: "base64", media_type: im.mediaType, data: im.base64 },
      })),
    ];
  }

  async function llamarIA(bloques) {
    const apiKey = getApiKey();
    const usarProxy = GEMINI_PROXY_URL !== "";
    if (!apiKey && !usarProxy) {
      throw new Error("FALTA_API_KEY");
    }
    const parts = bloques.map((b) =>
      b.type === "text"
        ? { text: b.text }
        : { inline_data: { mime_type: b.source.media_type, data: b.source.data } }
    );
    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        responseMimeType: "application/json",
      },
    };
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const esDemanda = (status, msg) =>
      status === 429 || status === 503 || status === 529 ||
      /high demand|busy|overloaded|unavailable|temporary|temporar/i.test(msg);
    const esModeloNoDisponible = (msg) =>
      /no longer available|not found|does not exist|model.*not|models\//i.test(msg);

    for (const modelo of MODELOS_GEMINI) {
      for (let intento = 0; intento < 4; intento++) {
        let response;
        try {
          const url = usarProxy
            ? GEMINI_PROXY_URL
            : `${GEMINI_API_URL}/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usarProxy ? { modelo, payload } : payload),
          });
        } catch (e) {
          if (intento < 3) {
            await esperar(3000);
            continue;
          }
          break;
        }
        const data = await response.json().catch(() => null);
        if (response.ok) {
          const raw = (data?.candidates?.[0]?.content?.parts || [])
            .map((p) => p.text || "")
            .join("")
            .trim();
          if (!raw) {
            throw new Error("RESPUESTA_VACIA");
          }
          const clean = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
          try {
            return JSON.parse(clean);
          } catch (e) {
            const inicio = clean.indexOf("{");
            const fin = clean.lastIndexOf("}");
            if (inicio !== -1 && fin > inicio) {
              try {
                return JSON.parse(clean.slice(inicio, fin + 1));
              } catch (e2) {
                // sigue abajo con el error detallado
              }
            }
            throw new Error(`PARSE:${clean.slice(0, 500)}`);
          }
        }
        const msg = data?.error?.message || "";
        if (esModeloNoDisponible(msg)) {
          break;
        }
        if (esDemanda(response.status, msg)) {
          if (intento < 3) {
            await esperar(4000 * (intento + 1));
            continue;
          }
          break;
        }
        if (/api key|key not|invalid/i.test(msg)) {
          throw new Error("CLAVE_INVALIDA");
        }
        throw new Error(`API:${msg || `Error HTTP ${response.status}`}`);
      }
    }
    throw new Error("DEMANDA_ALTA");
  }

  async function evaluar() {
    setLoading(true);
    setError(null);
    setResultado(null);
    setPuntajeAnterior(null);
    setVecesReeditado(0);
    try {
      const puestoBloques = bloquesDe(puesto, "Descripción del puesto");
      const cvBloques = bloquesDe(cv, "CV del candidato");
      const parsed = await llamarIA([...puestoBloques, ...cvBloques]);
      setUltimoPuestoBloques(puestoBloques);
      setCvEditable(parsed.cv_texto_extraido || "");
      setResultado(parsed);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setLoading(false);
    }
  }

  async function reevaluar() {
    if (!ultimoPuestoBloques || cvEditable.trim().length < 10) return;
    setReevaluando(true);
    setError(null);
    try {
      const cvBloques = [{ type: "text", text: `CV del candidato (versión editada por vos):\n${cvEditable}` }];
      const parsed = await llamarIA([...ultimoPuestoBloques, ...cvBloques]);
      setPuntajeAnterior(resultado?.puntaje_match ?? null);
      setResultado(parsed);
      setVecesReeditado((n) => n + 1);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setReevaluando(false);
    }
  }

  async function copiarCV() {
    const textarea = cvTextareaRef.current;
    try {
      if (textarea) {
        textarea.focus();
        textarea.select();
        const ok = document.execCommand && document.execCommand("copy");
        if (ok) {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
          return;
        }
      }
      await navigator.clipboard.writeText(cvEditable);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      // si ambos métodos fallan, al menos el texto quedó seleccionado para copiar manualmente (Ctrl+C)
      setCopiado(false);
    }
  }

  function limpiar() {
    setPuesto(emptyPanel());
    setCv(emptyPanel());
    setResultado(null);
    setError(null);
    setCvEditable("");
    setUltimoPuestoBloques(null);
    setPuntajeAnterior(null);
    setVecesReeditado(0);
    setCopiado(false);
  }

  return (
    <div style={{ background: BRAND.paper, minHeight: "100%", padding: "32px 20px", fontFamily: "Poppins, sans-serif" }}>
      <style>{`
        .fosforo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) {
          .fosforo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginBottom: 2 }}>
            <img src="/logo.png" alt="" style={{ height: 42, width: "auto", objectFit: "contain", display: "block", position: "relative", top: -9 }} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 800, color: BRAND.ink, letterSpacing: 0.5, lineHeight: "42px" }}>
              Fósforo
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, color: BRAND.text, margin: 0, marginTop: -8, fontWeight: 800, letterSpacing: -0.5 }}>
            ¿Este puesto es para vos?
          </h1>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300, fontSize: 14.5, color: BRAND.textMuted, marginTop: 10, lineHeight: 1.6 }}>
            Pegá capturas de la búsqueda y de tu CV. Podrás ver qué tareas y responsabilidades coinciden, cuáles son parciales y qué te falta, con la mirada de una reclutadora, no de un buscador de palabras clave. Recibirás sugerencias que podrás editar en línea y volver a evaluar el match, la idea es ayudarte a visibilizar mejor lo que ya tenés, no maquillar tu CV.
          </p>
        </div>

        <div className="fosforo-grid" style={{ marginBottom: 10 }}>
          <InputPanel label="Descripción del puesto" panel={puesto} setPanel={setPuesto} />
          <InputPanel
            label="Tu CV"
            panel={cv}
            setPanel={setCv}
            hint="¿Tu CV tiene varias hojas? Subí una captura por página, en orden."
          />
        </div>

        <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 11, color: BRAND.textMuted, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}>
          <span>🔒</span> No guardamos ni compartimos lo que cargás acá: se procesa solo para generar tu evaluación.
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
          <button
            onClick={evaluar}
            disabled={!puedeEvaluar}
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              padding: "11px 22px",
              borderRadius: 8,
              border: "none",
              background: puedeEvaluar ? BRAND.ink : BRAND.stone,
              color: "#FFFFFF",
              cursor: puedeEvaluar ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Evaluando..." : "Evaluar match"}
          </button>
          {hayAlgoParaLimpiar && (
            <button
              onClick={limpiar}
              disabled={loading || reevaluando}
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 13.5,
                fontWeight: 600,
                padding: "10px 18px",
                borderRadius: 8,
                border: `1.5px solid ${BRAND.stone}`,
                background: "transparent",
                color: BRAND.textMuted,
                cursor: loading || reevaluando ? "not-allowed" : "pointer",
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {loading && (
          <div ref={loaderRef}>
            <ScannerLoader />
          </div>
        )}

        {error && (
          <div
            ref={errorRef}
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: 13.5,
              color: "#7A3626",
              marginBottom: 20,
              background: "#F5EFE9",
              border: "1px solid #A8503955",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            {error}
          </div>
        )}

        {resultado && (
          <div ref={resultadoRef} style={{ borderTop: `1px dashed ${BRAND.stone}`, paddingTop: 24 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <ScoreStamp score={resultado.puntaje_match ?? 0} />
              <div>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, letterSpacing: 0.5, color: BRAND.textMuted, textTransform: "uppercase" }}>
                  Puesto detectado como
                </div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 800, color: BRAND.text }}>
                  {resultado.seniority_puesto || "—"}
                </div>
                {puntajeAnterior !== null && (
                  <div
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 12.5,
                      fontWeight: 600,
                      marginTop: 6,
                      color: resultado.puntaje_match >= puntajeAnterior ? "#3F6B45" : "#A85039",
                    }}
                  >
                    {resultado.puntaje_match >= puntajeAnterior ? "▲" : "▼"}{" "}
                    {Math.abs(resultado.puntaje_match - puntajeAnterior)} pts vs. tu versión anterior ({puntajeAnterior}%)
                  </div>
                )}
                {vecesReeditado >= 3 && (
                  <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 11.5, color: BRAND.slate, marginTop: 8, fontStyle: "italic", maxWidth: 320 }}>
                    Ya reevaluaste esta versión {vecesReeditado} veces. La idea es visibilizar mejor lo que ya tenés, no maquillar el CV — si sentís que ya diste con la mejor versión honesta, con eso alcanza.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
              <ResultList kind="fuertes" items={resultado.coincidencias_fuertes} />
              <ResultList kind="parciales" items={resultado.coincidencias_parciales} />
              <ResultList kind="faltantes" items={resultado.faltantes} />
            </div>

            {resultado.sugerencia && (
              <div style={{ background: BRAND.lavender, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 700, color: BRAND.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                  Para mejorar tu CV
                </div>
                <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, fontSize: 13.5, color: BRAND.text }}>{resultado.sugerencia}</div>
              </div>
            )}

            {resultado.nota_transparencia && (
              <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 300, fontSize: 12, color: BRAND.textMuted, fontStyle: "italic", lineHeight: 1.5, marginBottom: 22 }}>
                {resultado.nota_transparencia}
              </div>
            )}

            <div style={{ borderTop: `1px dashed ${BRAND.stone}`, paddingTop: 18 }}>
              <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 12.5, fontWeight: 600, color: BRAND.text, marginBottom: 4 }}>
                ¿Aplicaste la sugerencia? Editá tu CV acá y volvé a evaluar
              </div>
              <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 11.5, color: BRAND.textMuted, marginBottom: 8 }}>
                Este es un resumen de lo que leímos en tu imagen — no hace falta que vuelvas a subir nada, editalo directamente acá.
              </div>
              <textarea
                ref={cvTextareaRef}
                value={cvEditable}
                onChange={(e) => setCvEditable(e.target.value)}
                style={{
                  width: "100%",
                  height: 180,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${BRAND.stone}`,
                  background: "#FFFFFF",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  color: BRAND.text,
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginBottom: 10,
                }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={reevaluar}
                  disabled={reevaluando || cvEditable.trim().length < 10}
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 13.5,
                    fontWeight: 600,
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: `1.5px solid ${BRAND.ink}`,
                    background: "transparent",
                    color: BRAND.ink,
                    cursor: reevaluando ? "not-allowed" : "pointer",
                  }}
                >
                  {reevaluando ? "Volviendo a evaluar..." : "Volver a evaluar con estos cambios"}
                </button>
                <button
                  onClick={copiarCV}
                  disabled={cvEditable.trim().length === 0}
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: `1.5px solid ${BRAND.stone}`,
                    background: "transparent",
                    color: copiado ? "#3F6B45" : BRAND.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {copiado ? "✓ Copiado" : "Copiar este texto"}
                </button>
              </div>
              {reevaluando && (
                <div ref={loaderRef}>
                  <ScannerLoader />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
