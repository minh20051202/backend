import request from "supertest";
import { Application } from "express";
import { createApp } from "../src/app";
import { DVPNController } from "../src/controllers/dVPN.controller";
import { DVPNService } from "../src/services/dVPN.service";
import { DVPNClient } from "../src/clients/dVPN.client";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Integration Test: GET /vpn/active", () => {
  let app: Application;
  const FAKE_API_KEY = "test-api-key";
  let originalEnv: NodeJS.ProcessEnv;

  // Safely manage environment variables
  beforeAll(() => {
    originalEnv = { ...process.env };
  });
  afterAll(() => {
    process.env = originalEnv;
  });
  // Before each test, assemble a fresh instance of our application
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DVPN_API_KEY = FAKE_API_KEY;
    const dVPNClient = new DVPNClient();
    const dVPNService = new DVPNService(dVPNClient);
    const dVPNController = new DVPNController(dVPNService);

    app = createApp(dVPNController);
  });

  // --- Test Case 1: The Happy Path ---
  it("should return a 200 OK with a valid VPN config when all downstream APIs succeed", async () => {
    // --- ARRANGE ---
    mockedAxios.post
      .mockResolvedValueOnce({ data: { data: { token: "test-device-token" } } }) // For createDevice
      .mockResolvedValueOnce({ data: { data: { private_key: "TEST_KEY" } } }); // For createServerCredentials

    mockedAxios.get
      .mockResolvedValueOnce({ data: { data: [{ id: "us", name: "USA" }] } }) // For getCountries
      .mockResolvedValueOnce({
        data: { data: [{ id: "nyc", name: "New York" }] },
      }) // For getCities
      .mockResolvedValueOnce({
        data: { data: [{ id: "server-1", name: "NY-01" }] },
      }); // For getServers

    // --- ACT ---
    // Use supertest to make a real HTTP request to our in-memory app
    const response = await request(app).get("/vpn/active");

    // --- ASSERT ---
    // Check the final HTTP response
    expect(response.status).toBe(200);
    expect(response.body.city).toBe("New York");
    expect(response.body.server).toBe("NY-01");
    expect(response.body.config).toContain("PrivateKey = TEST_KEY");
  });

  // --- Test Case 2: A Critical Sad Path ---
  it("should return a 404 Not Found if no countries are available", async () => {
    // --- ARRANGE ---
    // Mock the chain up to the point of failure
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { token: "test-device-token" } },
    }); // createDevice succeeds
    mockedAxios.get.mockResolvedValueOnce({ data: { data: [] } }); // getCountries returns an empty array

    // --- ACT ---
    const response = await request(app).get("/vpn/active");

    // --- ASSERT ---
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "No countries found" });
  });
});
