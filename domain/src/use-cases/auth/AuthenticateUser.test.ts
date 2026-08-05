import { AuthenticateUser } from "./AuthenticateUser";
import { RegisterUser } from "./RegisterUser";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { FakePasswordHasher } from "./__fakes__/FakePasswordHasher";
import { FakeTokenService } from "./__fakes__/FakeTokenService";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";

describe("AuthenticateUser", () => {
  function setup() {
    const userRepository = new InMemoryUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenService = new FakeTokenService();
    const registerUser = new RegisterUser(userRepository, passwordHasher);
    const authenticateUser = new AuthenticateUser(
      userRepository,
      passwordHasher,
      tokenService,
    );
    return { registerUser, authenticateUser, tokenService };
  }

  it("autentica un usuario con credenciales correctas y devuelve un token", async () => {
    const { registerUser, authenticateUser, tokenService } = setup();

    await registerUser.execute({
      name: "Ana",
      email: "ana@test.com",
      password: "supersecreta123",
    });

    const result = await authenticateUser.execute({
      email: "ana@test.com",
      password: "supersecreta123",
    });

    expect(result.token).toBeDefined();
    expect(tokenService.verify(result.token)).toMatchObject({
      role: "MEMBER",
    });
  });

  it("rechaza credenciales con password incorrecta", async () => {
    const { registerUser, authenticateUser } = setup();

    await registerUser.execute({
      name: "Ana",
      email: "ana@test.com",
      password: "supersecreta123",
    });

    await expect(
      authenticateUser.execute({
        email: "ana@test.com",
        password: "incorrecta",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("rechaza un email que no está registrado", async () => {
    const { authenticateUser } = setup();

    await expect(
      authenticateUser.execute({
        email: "noexiste@test.com",
        password: "cualquiera",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
