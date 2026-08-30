export const preguntas = [
  {
    id: 1,
    texto: "Tengo descripciones de puestos actualizadas",
    tip: "Las descripciones de puestos son la base para saber qué buscar al contratar, evaluar el rendimiento y planificar capacitaciones. Sin ellas, se trabaja con expectativas difusas."
  },
  {
    id: 2,
    texto: "Todos los líderes saben qué se espera de ellos",
    tip: "Cuando los líderes no tienen claridad sobre sus responsabilidades, la toma de decisiones se vuelve inconsistente y genera confusión en los equipos."
  },
  {
    id: 3,
    texto: "Tenemos un proceso definido para incorporar personas",
    tip: "Un proceso de onboarding estructurado reduce la rotación y acelera el tiempo en que una persona nueva aporta valor a la empresa."
  },
  {
    id: 4,
    texto: "Damos feedback de manera periódica",
    tip: "El feedback regular mejora el clima laboral, alinea expectativas y permite corregir problemáticas antes de que escalen."
  },
  {
    id: 5,
    texto: "Tenemos políticas claras (uso de herramientas, licencias, etc.)",
    tip: "Las políticas claras protegen a la empresa y dan seguridad a los colaboradores. Sin ellas, cada situación se resuelve de manera arbitraria, según el criterio de la persona que la aplica."
  },
  {
    id: 6,
    texto: "Las responsabilidades están bien definidas y se comunican",
    tip: "Cuando las responsabilidades no están claras, se duplican tareas, se cometen errores y se genera frustración en los equipos."
  },
  {
    id: 7,
    texto: "Podemos cubrir una vacante sin improvisar",
    tip: "Tener un plan de sucesión y procesos de reclutamiento ágiles evita que las vacantes afecten la productividad del negocio."
  },
  {
    id: 8,
    texto: "La comunicación interna funciona (se comparte información relevante a tiempo)",
    tip: "Una comunicación interna deficiente genera desalineación, rumores y pérdida de compromiso. Mejorarla es uno de los cambios con mayor impacto."
  },
  {
    id: 9,
    texto: "Los conflictos se resuelven rápidamente y no escalan",
    tip: "Los conflictos no resueltos se convierten en ambientes tóxicos. Contar con mecanismos de resolución es clave para mantener un equipo sano."
  },
  {
    id: 10,
    texto: "Las personas saben cómo crecer dentro de la empresa",
    tip: "Sin una ruta de crecimiento clara, las personas buscan oportunidades afuera. Retener talento requiere mostrarles un futuro dentro de la organización."
  }
];

export const segmentacion = [
  { id: "tamano", texto: "¿Cuántas personas trabajan en tu empresa?", opciones: ["1 a 10", "11 a 50", "Más de 50"] }
];

export const niveles = [
  {
    min: 8,
    max: 10,
    titulo: "Tu gestión acompaña el crecimiento",
    descripcion: "Tenés una base sólida. Quizás puedas potenciar algunos áreas para escalar sin perder calidad en la gestión de personas.",
    color: "#110A9F",
    colorFondo: "#E3E2FD"
  },
  {
    min: 4,
    max: 7,
    titulo: "Hay una buena base, pero todavía existen áreas para fortalecer",
    descripcion: "Identificaste oportunidades clave. Con ajustes puntuales, podés profesionalizar tu gestión y evitar problemas mayores a futuro.",
    color: "#6A74A0",
    colorFondo: "#F0F0F5"
  },
  {
    min: 0,
    max: 3,
    titulo: "Hay oportunidades para ordenar procesos básicos",
    descripcion: "Estás a tiempo de poner orden. Los procesos fundamentales de RR.HH. pueden marcar una gran diferencia en el día a día de tu equipo.",
    color: "#BFBEB0",
    colorFondo: "#FAFAFA"
  }
];

export function calcularPuntaje(respuestas) {
  let puntaje = 0;
  preguntas.forEach(p => {
    if (respuestas[p.id] === true) puntaje++;
  });
  return puntaje;
}

export function obtenerNivel(puntaje) {
  return niveles.find(n => puntaje >= n.min && puntaje <= n.max);
}

export function obtenerTipsPersonalizados(respuestas) {
  const tips = [];
  preguntas.forEach(p => {
    if (respuestas[p.id] === false) {
      tips.push({ id: p.id, texto: p.texto, tip: p.tip });
    }
  });
  return tips;
}
