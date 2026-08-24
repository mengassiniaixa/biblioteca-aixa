import { buildApp } from "./app";
import { loadConfig } from "./config";
import { buildContainer } from "./composition/container";

function main() {
  const config = loadConfig();
  const container = buildContainer({
    jwtSecret: config.jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn,
  });
  const app = buildApp(container);

  app.listen(config.port, () => {
    console.log(`biblioteca-aixa backend escuchando en :${config.port}`);
  });
}

main();
