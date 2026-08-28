import { buildApp } from "./app";
import { loadConfig } from "./config";
import { buildContainer } from "./composition/container";

async function main() {
  const config = loadConfig();
  const container = buildContainer({
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  });
  await container.seedLibrarian(config.seedLibrarian);
  await container.seedBooks();
  if (config.seedDemoOverdue) {
    await container.seedDemoOverdue();
  }
  const app = buildApp(container);

  app.listen(config.port, () => {
    console.log(`biblioteca-aixa backend escuchando en :${config.port}`);
    console.log(
      `  seed LIBRARIAN: ${config.seedLibrarian.email} / ${config.seedLibrarian.password}`,
    );
    if (config.seedDemoOverdue) {
      console.log(
        `  seed MEMBER demo overdue: demo-overdue@biblioteca.local / member123 (loan de Dune vencido hace 15 días)`,
      );
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
