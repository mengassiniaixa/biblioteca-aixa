export type RepositoryMode = "memory" | "pg";

interface Config {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  repositoryMode: RepositoryMode;
  databaseUrl: string | null;
  seedLibrarian: {
    name: string;
    email: string;
    password: string;
  };
  seedDemoOverdue: boolean;
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 3000);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-only-secret";
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "1d";

  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  const rawMode = (process.env.REPOSITORY_MODE ?? "memory").toLowerCase();
  if (rawMode !== "memory" && rawMode !== "pg") {
    throw new Error(
      `Invalid REPOSITORY_MODE: ${process.env.REPOSITORY_MODE} (esperado "memory" o "pg")`,
    );
  }
  const repositoryMode = rawMode as RepositoryMode;
  const databaseUrl = process.env.DATABASE_URL ?? null;

  if (repositoryMode === "pg" && !databaseUrl) {
    throw new Error("REPOSITORY_MODE=pg requiere DATABASE_URL");
  }

  return {
    port,
    jwtSecret,
    jwtExpiresIn,
    repositoryMode,
    databaseUrl,
    seedLibrarian: {
      name: process.env.SEED_LIBRARIAN_NAME ?? "Bibliotecaria",
      email: process.env.SEED_LIBRARIAN_EMAIL ?? "librarian@biblioteca.local",
      password: process.env.SEED_LIBRARIAN_PASSWORD ?? "librarian123",
    },
    seedDemoOverdue: process.env.SEED_DEMO_OVERDUE === "true",
  };
}
