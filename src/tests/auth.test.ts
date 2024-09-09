import { beforeEach, describe, it, expect, spyOn, mock } from "bun:test";
import { login, register } from "@/services/authService";
import { faker } from "@faker-js/faker";
import * as userModel from "@/models/userModel";
import * as authUtils from "@/utils/authUtils";
import * as jwtUtils from "@/utils/jwtUtils";
import authRoute from "@/routes/authRoute";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

let mockedUser: User = {
  id: faker.number.int(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
};

let hashedPassword: string = faker.internet.password();
let jwtToken: string = faker.string.uuid();

beforeEach(() => {
  mock.restore();

  spyOn(authUtils, "hashPassword").mockResolvedValue(hashedPassword);
  spyOn(authUtils, "verifyPassword").mockResolvedValue(true);
  spyOn(jwtUtils, "createToken").mockResolvedValue(jwtToken);
});

describe("AuthService - Register", () => {
  it("should register a new user using service", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(null);
    spyOn(userModel, "createUser").mockResolvedValue(mockedUser);

    const result = await register({
      name: mockedUser.name,
      email: mockedUser.email,
      password: "password",
      confirmPassword: "password",
    });

    expect(userModel.getUser).toHaveBeenCalledWith(mockedUser.email);
    expect(authUtils.hashPassword).toHaveBeenCalledWith("password");
    expect(userModel.createUser).toHaveBeenCalledWith({
      name: mockedUser.name,
      email: mockedUser.email,
      password: hashedPassword,
    });
    expect(result).toEqual({ name: mockedUser.name, email: mockedUser.email });
  });

  it("should register a new user via endpoint", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(null);
    spyOn(userModel, "createUser").mockResolvedValue(mockedUser);

    const response = await authRoute.request("/register", {
      method: "POST",
      body: JSON.stringify({
        name: mockedUser.name,
        email: mockedUser.email,
        password: "password",
        confirmPassword: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toEqual(201);
    expect(await response.json()).toEqual({
      data: { name: mockedUser.name, email: mockedUser.email },
      status: "success",
    });
  });

  it("should throw error when email is already registered", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(mockedUser);

    const result = register({
      name: mockedUser.name,
      email: mockedUser.email,
      password: "password",
      confirmPassword: "password",
    });

    expect(result).rejects.toThrow("Email already registered!");
  });
});

describe("AuthService - Login", () => {
  it("should return a JWT token for valid credentials", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(mockedUser);

    const token = await login({
      email: mockedUser.email,
      password: "password",
    });

    expect(userModel.getUser).toHaveBeenCalledWith(mockedUser.email);
    expect(authUtils.verifyPassword).toHaveBeenCalledWith(
      "password",
      mockedUser.password
    );
    expect(jwtUtils.createToken).toHaveBeenCalledWith(mockedUser.email);
    expect(token).toBe(jwtToken);
  });

  it("should login via endpoint", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(mockedUser);

    const response = await authRoute.request("/login", {
      method: "POST",
      body: JSON.stringify({ email: mockedUser.email, password: "password" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      status: "success",
      data: { email: mockedUser.email, token: jwtToken },
    });
  });

  it("should throw an error for invalid credentials", async () => {
    spyOn(userModel, "getUser").mockResolvedValue(null);

    const result = login({
      email: mockedUser.email,
      password: "wrongpassword",
    });

    expect(result).rejects.toThrow("Email or password is incorrect!");
  });
});
