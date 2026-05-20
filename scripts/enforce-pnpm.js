const userAgent = process.env.npm_config_user_agent || "";
const fs = require("fs");

// Solo enforce fuera de Docker - detectar si estamos en contenedor
let isInContainer = false;
try {
  isInContainer = fs.existsSync("/.dockerenv") || fs.existsSync("/.dockerinit");
} catch {
  // Ignorar si no podemos leer
}

if (!isInContainer && !userAgent.includes("pnpm")) {
  console.error("\nERROR: Este repositorio usa solo pnpm.");
  console.error("Instala dependencias con pnpm y no uses npm ni yarn.\n");
  process.exit(1);
}
