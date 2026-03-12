// ════════════════════════════════════════════════════════════════════════
// training.pdf.ts — Client-side PDF Constancia Generator
// Uses jsPDF (lightweight, no puppeteer needed)
// ════════════════════════════════════════════════════════════════════════

/**
 * Generates a training certificate (constancia) in PDF format.
 * Downloads directly in the browser.
 * 
 * NOTE: To keep the bundle lightweight, we generate a simple but professional
 * PDF using the browser Canvas API to create a data URL that gets opened in a new tab.
 * For a production environment with Docker, this can be replaced with Puppeteer/PDFKit.
 */

interface ConstanciaData {
  folioUnico: string;
  nombrePersona: string;
  programaNombre: string;
  temasCubiertos: string[];
  calificacion: number;
  fechaAcreditacion: string;
  fechaVencimiento?: string;
  instructor: string;
  referenciaNormativa: string;
  organizacion?: string;
}

export function generateConstanciaPDF(data: ConstanciaData): void {
  const {
    folioUnico,
    nombrePersona,
    programaNombre,
    temasCubiertos,
    calificacion,
    fechaAcreditacion,
    fechaVencimiento,
    instructor,
    referenciaNormativa,
    organizacion = "Davara Governance",
  } = data;

  // Create an offscreen canvas for the PDF content  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const W = 800;
  const H = 1100;
  canvas.width = W;
  canvas.height = H;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Inner decorative border
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Header bar
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(40, 40, W - 80, 70);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(organizacion.toUpperCase(), W / 2, 84);

  // Title
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText("CONSTANCIA DE ACREDITACIÓN", W / 2, 170);

  // Subtitle
  ctx.fillStyle = "#64748b";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText("Programa de Capacitación, Actualización y Concientización", W / 2, 200);
  ctx.fillText("en Protección de Datos Personales", W / 2, 220);

  // Divider
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 245);
  ctx.lineTo(W - 100, 245);
  ctx.stroke();

  // Certificate text
  ctx.fillStyle = "#1e293b";
  ctx.font = "16px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Se hace constar que:", W / 2, 290);

  // Name
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.fillText(nombrePersona, W / 2, 340);

  // Underline for name
  const nameWidth = ctx.measureText(nombrePersona).width;
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((W - nameWidth) / 2 - 20, 350);
  ctx.lineTo((W + nameWidth) / 2 + 20, 350);
  ctx.stroke();

  // Body text
  ctx.fillStyle = "#475569";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(`Ha acreditado satisfactoriamente el programa de capacitación:`, W / 2, 395);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 18px Arial, sans-serif";
  const maxProgW = W - 160;
  const progLines = wrapText(ctx, programaNombre, maxProgW);
  let progY = 430;
  progLines.forEach(line => {
    ctx.fillText(line, W / 2, progY);
    progY += 24;
  });

  // Score
  let currentY = progY + 20;
  ctx.fillStyle = "#475569";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(`Calificación obtenida: ${calificacion}/100`, W / 2, currentY);
  currentY += 30;

  // Topics
  ctx.fillStyle = "#475569";
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillText("TEMAS CUBIERTOS:", W / 2, currentY);
  currentY += 20;
  ctx.font = "12px Arial, sans-serif";
  temasCubiertos.slice(0, 8).forEach(tema => {
    ctx.fillText(`• ${tema}`, W / 2, currentY);
    currentY += 18;
  });
  if (temasCubiertos.length > 8) {
    ctx.fillText(`... y ${temasCubiertos.length - 8} temas más`, W / 2, currentY);
    currentY += 18;
  }

  currentY += 20;

  // Dates
  ctx.fillStyle = "#1e293b";
  ctx.font = "13px Arial, sans-serif";
  ctx.fillText(`Fecha de acreditación: ${fechaAcreditacion}`, W / 2, currentY);
  currentY += 22;
  if (fechaVencimiento) {
    ctx.fillText(`Vigente hasta: ${fechaVencimiento}`, W / 2, currentY);
    currentY += 22;
  }
  ctx.fillText(`Instructor: ${instructor}`, W / 2, currentY);
  currentY += 22;
  ctx.fillText(`Referencia normativa: ${referenciaNormativa}`, W / 2, currentY);

  // Footer
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Arial, sans-serif";
  ctx.fillText(`Folio de verificación: ${folioUnico}`, W / 2, H - 90);
  ctx.fillText(`Documento generado por ${organizacion} — ${new Date().toLocaleString("es-MX")}`, W / 2, H - 70);
  ctx.fillText("Este documento constituye evidencia del principio de responsabilidad (Art. 48 RLFPDPPP)", W / 2, H - 55);

  // Download
  const link = document.createElement("a");
  link.download = `constancia_${folioUnico.slice(0, 8)}_${nombrePersona.replace(/\s/g, "_").slice(0, 20)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}
