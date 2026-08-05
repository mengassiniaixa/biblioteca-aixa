import { RegisterUser } from "./RegisterUser";
import { InMemoryUserRepository } from "./__fakes__/InMemoryUserRepository";
import { FakePasswordHasher } from "./__fakes__/FakePasswordHasher";
import { EmailAlreadyInUseError } from "../../errors/EmailAlreadyInUseError";

describe("RegisterUser", () => {
  function setup() {
    const userRepository = new InMemoryUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const registerUser = new RegisterUser(userRepository, passwordHasher);
    return { userRepository, passwordHasher, registerUser };
  }

  it("registra un usuario nuevo con rol MEMBER por defecto", async () => {
    const { registerUser, userRepository } = setup();

    const result = await registerUser.execute({
      name: "Ana",
      email: "ana@test.com",
      password: "supersecreta123",
    });

    expect(result.role).toBe("MEMBER");
    expect(result.email).toBe("ana@test.com");

    const saved = await userRepository.findByEmail("ana@test.com");
    expect(saved).not.toBeNull();
    expect(saved?.passwordHash).toBe("hashed:supersecreta123");
  });

  it("no permite registrar dos usuarios con el mismo email", async () => {
    const { registerUser } = setup();

    await registerUser.execute({
      name: "Ana",
      email: "ana@test.com",
      password: "supersecreta123",
    });

    await expect(
      registerUser.execute({
        name: "Ana 2",
        email: "ANA@TEST.com",
        password: "otraPassword",
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
  });

  it("no expone el passwordHash en el resultado", async () => {
    const { registerUser } = setup();

    const result = await registerUser.execute({
      name: "Ana",
      email: "ana@test.com",
      password: "supersecreta123",
    });

    expect((result as any).passwordHash).toBeUndefined();
  });
});
