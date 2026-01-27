const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "app"); // Cambia si tu carpeta principal no se llama "app"

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes('from "next/link"')) {
    // Reemplaza la importación
    content = content.replace(/import\s+Link\s+from\s+["']next\/link["'];?/g, 'import { SafeLink } from "@/components/SafeLink"');

    // Reemplaza todas las ocurrencias de <Link ...>...</Link>
    content = content.replace(/<Link([^>]*)href=({[^}]+}|["'][^"']+["'])([^>]*)>/g, "<SafeLink href=$2>");
    content = content.replace(/<\/Link>/g, "</SafeLink>");

    fs.writeFileSync(filePath, content, "utf8");
    console.log("✅ Reemplazado en:", filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".tsx")) {
      replaceInFile(fullPath);
    }
  }
}

walk(targetDir);
