import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import { preguntas, segmentacion, calcularPuntaje, obtenerNivel, obtenerTipsPersonalizados } from "./preguntas";
import GenerarPDF from "./GenerarPDF";
import "./DiagnosticoRRHH.css";

const EMAILJS_SERVICE_ID = "service_2b4kryo";
const EMAILJS_TEMPLATE_ID = "template_i7h6ajm";
const EMAILJS_PUBLIC_KEY = "uSmAlmuSogmtPDMTH";

const PASOS = {
  LANDING: "landing",
  PREGUNTAS: "preguntas",
  RESULTADO: "resultado",
  CONTACTO: "contacto",
  CONFIRMACION: "confirmacion"
};

export default function DiagnosticoRRHH() {
  const [paso, setPaso] = useState(PASOS.LANDING);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [tamanoEmpresa, setTamanoEmpresa] = useState(null);
  const [contacto, setContacto] = useState({ nombre: "", email: "", empresa: "", telefono: "" });
  const [showTips, setShowTips] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const resultadoRef = useRef(null);

  const totalPreguntas = preguntas.length;
  const progreso = ((preguntaActual + 1) / totalPreguntas) * 100;

  const puntaje = calcularPuntaje(respuestas);
  const nivel = obtenerNivel(puntaje);
  const tipsPersonalizados = obtenerTipsPersonalizados(respuestas);

  const handleRespuesta = (preguntaId, valor) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
    if (preguntaActual < totalPreguntas - 1) {
      setTimeout(() => setPreguntaActual(prev => prev + 1), 300);
    } else {
      setTimeout(() => setPaso(PASOS.RESULTADO), 500);
    }
  };

  const handleTamano = (valor) => {
    setTamanoEmpresa(valor);
    setTimeout(() => setPreguntaActual(0), 300);
  };

  const handleContacto = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const tipsFormateados = tipsPersonalizados
      .map(tip => `${tip.texto}: ${tip.tip}`)
      .join("\n\n");

    const templateParams = {
      nombre: contacto.nombre,
      email: contacto.email,
      empresa: contacto.empresa || "No especificada",
      telefono: contacto.telefono || "No especificado",
      puntaje: `${puntaje}`,
      nivel: nivel.titulo,
      tips: tipsFormateados || "¡Felicitaciones! Todas tus respuestas fueron positivas."
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setPaso(PASOS.CONFIRMACION);
    } catch (error) {
      console.error("Error al enviar email:", error);
      alert("Hubo un error al enviar el email. Por favor, intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleDescargarSinDatos = () => {
    setShowTips(false);
    GenerarPDF({ puntaje, nivel, tips: [], nombre: "", empresa: "", sinDatos: true });
  };

  const handleDescargarConDatos = () => {
    setShowTips(true);
    GenerarPDF({ puntaje, nivel, tips: tipsPersonalizados, nombre: contacto.nombre, empresa: contacto.empresa, sinDatos: false });
  };

  if (paso === PASOS.LANDING) {
    return (
      <div className="diagnostico-container">
        <div className="landing">
          <div className="landing-header">
            <img src="/logo-paulatinamente.png" alt="Paulatinamente" className="logo" />
          </div>
          <div className="landing-content">
            <h1 className="landing-titulo">Diagnóstico de Gestión de Personas</h1>
            <p className="landing-subtitulo">
              Descubrí en 2 minutos si tu gestión de personas está lista para crecer
            </p>
            <p className="landing-descripcion">
              Respondé 10 preguntas simples y recibí un análisis personalizado con ideas prácticas para fortalecer tu gestión de personas
            </p>
            <button className="btn-principal" onClick={() => setPaso(PASOS.PREGUNTAS)}>
              Comenzá el diagnóstico
            </button>
            <p className="landing-tiempo">Toma menos de 2 minutos</p>
          </div>
        </div>
      </div>
    );
  }

  if (paso === PASOS.PREGUNTAS) {
    const pregunta = preguntas[preguntaActual];
    return (
      <div className="diagnostico-container">
        <div className="formulario">
          <div className="formulario-header">
            <img src="/logo-paulatinamente.png" alt="Paulatinamente" className="logo-pequeño" />
            <div className="progreso-container">
              <div className="progreso-barra" style={{ width: `${progreso}%` }} />
              <span className="progreso-texto">{preguntaActual + 1} de {totalPreguntas}</span>
            </div>
          </div>

          <div className="pregunta-container">
            <h2 className="pregunta-numero">Pregunta {preguntaActual + 1}</h2>
            <p className="pregunta-texto">{pregunta.texto}</p>
            <div className="respuestas">
              <button
                className={`respuesta-btn ${respuestas[pregunta.id] === true ? 'seleccionada' : ''}`}
                onClick={() => handleRespuesta(pregunta.id, true)}
              >
                Sí
              </button>
              <button
                className={`respuesta-btn ${respuestas[pregunta.id] === false ? 'seleccionada' : ''}`}
                onClick={() => handleRespuesta(pregunta.id, false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paso === PASOS.RESULTADO) {
    return (
      <div className="diagnostico-container">
        <div className="resultado" ref={resultadoRef}>
          <div className="resultado-header">
            <img src="/logo-paulatinamente.png" alt="Paulatinamente" className="logo-pequeño" />
          </div>

          <div className="resultado-contenido">
            <div className="puntaje-container" style={{ backgroundColor: nivel.colorFondo }}>
              <div className="puntaje-circulo" style={{ borderColor: nivel.color }}>
                <span className="puntaje-numero" style={{ color: nivel.color }}>{puntaje}</span>
                <span className="puntaje-total">/10</span>
              </div>
            </div>

            <h2 className="resultado-titulo" style={{ color: nivel.color }}>{nivel.titulo}</h2>
            <p className="resultado-descripcion">{nivel.descripcion}</p>

            {tipsPersonalizados.length > 0 && (
              <div className="tips-preview">
                <p className="tips-cantidad">
                  Identificamos <strong>{tipsPersonalizados.length} área{tipsPersonalizados.length > 1 ? 's' : ''}</strong> para fortalecer
                </p>
              </div>
            )}

            <div className="acciones-resultado">
              <button className="btn-secundario" onClick={handleDescargarSinDatos}>
                Descargar resumen básico
              </button>
              <button className="btn-principal" onClick={() => setPaso(PASOS.CONTACTO)}>
                Recibir tips personalizados
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paso === PASOS.CONTACTO) {
    return (
      <div className="diagnostico-container">
        <div className="contacto-formulario">
          <div className="contacto-header">
            <img src="/logo-paulatinamente.png" alt="Paulatinamente" className="logo-pequeño" />
            <h2>Recibí tu diagnóstico personalizado</h2>
            <p>Completá tus datos y te enviaremos un análisis detallado con tips específicos para tu empresa</p>
          </div>

          <form onSubmit={handleContacto} className="formulario-contacto">
            <div className="campo">
              <label htmlFor="nombre">Nombre y apellido *</label>
              <input
                type="text"
                id="nombre"
                required
                value={contacto.nombre}
                onChange={e => setContacto(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>

            <div className="campo">
              <label htmlFor="email">Correo electrónico *</label>
              <input
                type="email"
                id="email"
                required
                value={contacto.email}
                onChange={e => setContacto(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="campo">
              <label htmlFor="empresa">Empresa</label>
              <input
                type="text"
                id="empresa"
                value={contacto.empresa}
                onChange={e => setContacto(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>

            <div className="campo">
              <label htmlFor="telefono">Teléfono / WhatsApp</label>
              <input
                type="tel"
                id="telefono"
                value={contacto.telefono}
                onChange={e => setContacto(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>

            <div className="acciones-contacto">
              <button type="button" className="btn-secundario" onClick={() => setPaso(PASOS.RESULTADO)}>
                Volver
              </button>
              <button type="submit" className="btn-principal" disabled={enviando}>
                {enviando ? "Enviando..." : "Recibir diagnóstico"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (paso === PASOS.CONFIRMACION) {
    return (
      <div className="diagnostico-container">
        <div className="confirmacion">
          <div className="confirmacion-header">
            <img src="/logo-paulatinamente.png" alt="Paulatinamente" className="logo-pequeño" />
          </div>

          <div className="confirmacion-contenido">
            <div className="check-icon">✓</div>
            <h2>¡Gracias, {contacto.nombre}!</h2>
            <p className="confirmacion-mensaje">
              No siempre es un problema de personas. Muchas veces es un problema de gestión. Y ahí es donde Recursos Humanos puede aportar mucho más que hacer búsquedas.
            </p>

            {showTips && (
              <button className="btn-principal" onClick={handleDescargarConDatos}>
                Descargar mi diagnóstico personalizado
              </button>
            )}

            <div className="contacto-info">
              <p>¿Querés ampliar información?</p>
              <a href="mailto:paula@paulatinamente.com.ar" className="contacto-link">
                paula@paulatinamente.com.ar
              </a>
              <a href="https://wa.me/541171511160" className="contacto-link" target="_blank" rel="noopener noreferrer">
                11 7151-1160
              </a>
            </div>

            <div className="agendar-opciones">
              <p className="agendar-titulo">¿Querés agendar una reunión?</p>
              <div className="agendar-botones">
                <a href="https://calendar.app.google/2M9juVbx5P2eMEYn6" 
                   className="btn-calendar" 
                   target="_blank" 
                   rel="noopener noreferrer">
                  Elegir horario en Google Calendar
                </a>
                <a href="https://wa.me/541171511160?text=Hola%20Paula%2C%20complet%C3%A9%20el%20diagn%C3%B3stico%20y%20me%20gustar%C3%ADa%20agendar%20una%20reuni%C3%B3n" 
                   className="btn-whatsapp" 
                   target="_blank" 
                   rel="noopener noreferrer">
                  WhatsApp directo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
