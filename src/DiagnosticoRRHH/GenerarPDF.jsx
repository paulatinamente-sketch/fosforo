import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default async function GenerarPDF({ puntaje, nivel, tips, nombre, empresa, sinDatos }) {
  const pdf = new jsPDF("p", "mm", "a4");
  const anchoPagina = pdf.internal.pageSize.getWidth();

  // Colores del manual de marca
  const azulOscuro = [17, 10, 159];
  const grisClaro = [191, 190, 176];
  const lila = [227, 226, 253];
  const grisOscuro = [106, 116, 160];

  // Fondo
  pdf.setFillColor(250, 250, 250);
  pdf.rect(0, 0, anchoPagina, 297, "F");

  // Header
  pdf.setFillColor(...azulOscuro);
  pdf.rect(0, 0, anchoPagina, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("Paulatinamente", anchoPagina / 2, 20, { align: "center" });

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Diagnóstico de Gestión de Personas", anchoPagina / 2, 32, { align: "center" });

  // Puntaje
  const centroY = 70;
  pdf.setFillColor(...lila);
  pdf.circle(anchoPagina / 2, centroY, 30, "F");

  pdf.setFillColor(...azulOscuro);
  pdf.circle(anchoPagina / 2, centroY, 25, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(36);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${puntaje}`, anchoPagina / 2, centroY + 2, { align: "center" });

  pdf.setFontSize(12);
  pdf.text("/10", anchoPagina / 2, centroY + 12, { align: "center" });

  // Nivel
  const nivelColor = nivel.color === "#110A9F" ? azulOscuro : 
                     nivel.color === "#6A74A0" ? grisOscuro : grisClaro;

  pdf.setTextColor(...nivelColor);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(nivel.titulo, anchoPagina / 2, 120, { align: "center" });

  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  const descripcionLines = pdf.splitTextToSize(nivel.descripcion, anchoPagina - 60);
  pdf.text(descripcionLines, anchoPagina / 2, 135, { align: "center" });

  // Tips personalizados
  if (!sinDatos && tips.length > 0) {
    let yPos = 165;

    pdf.setTextColor(...azulOscuro);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Áreas para fortalecer", anchoPagina / 2, yPos, { align: "center" });
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);

    tips.forEach((tip, index) => {
      if (yPos > 260) {
        pdf.addPage();
        yPos = 30;
      }

      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${tip.texto}`, 25, yPos);
      yPos += 5;

      pdf.setFont("helvetica", "normal");
      const tipLines = pdf.splitTextToSize(tip.tip, anchoPagina - 50);
      pdf.text(tipLines, 25, yPos);
      yPos += tipLines.length * 4 + 8;
    });
  }

  // Footer
  pdf.setFillColor(...grisClaro);
  pdf.rect(0, 270, anchoPagina, 27, "F");

  pdf.setTextColor(...azulOscuro);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("¿Querés ampliar información?", anchoPagina / 2, 280, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.text("paula@paulatinamente.com.ar | 11 7151-1160", anchoPagina / 2, 288, { align: "center" });

  // Descargar
  const nombreArchivo = sinDatos 
    ? "diagnostico-basico-paulatinamente.pdf"
    : `diagnostico-${nombre ? nombre.toLowerCase().replace(/\s+/g, '-') : 'personalizado'}-paulatinamente.pdf`;

  pdf.save(nombreArchivo);
}
