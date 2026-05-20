const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.includes("pnpm")) {
  console.error("\nERROR: Este repositorio usa solo pnpm.");
  console.error("Instala dependencias con pnpm y no uses npm ni yarn.\n");
  process.exit(1);
}
