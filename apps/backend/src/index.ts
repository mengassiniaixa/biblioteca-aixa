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
  const app = buildApp(container);

  app.listen(config.port, () => {
    console.log(`biblioteca-aixa backend escuchando en :${config.port}`);
    console.log(
      `  seed LIBRARIAN: ${config.seedLibrarian.email} / ${config.seedLibrarian.password}`,
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
