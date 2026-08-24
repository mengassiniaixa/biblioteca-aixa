interface Config {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 3000);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-only-secret";
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "1d";

  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return { port, jwtSecret, jwtExpiresIn };
}
