interface Config {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  seedLibrarian: {
    name: string;
    email: string;
    password: string;
  };
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 3000);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-only-secret";
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "1d";

  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return {
    port,
    jwtSecret,
    jwtExpiresIn,
    seedLibrarian: {
      name: process.env.SEED_LIBRARIAN_NAME ?? "Bibliotecaria",
      email: process.env.SEED_LIBRARIAN_EMAIL ?? "librarian@biblioteca.local",
      password: process.env.SEED_LIBRARIAN_PASSWORD ?? "librarian123",
    },
  };
}
