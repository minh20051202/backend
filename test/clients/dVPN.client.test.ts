import axios from "axios";
import { DVPNClient } from "../../src/clients/dVPN.client";

// Mock the entire axios module
jest.mock("axios");

// Create a typed mock for autocompletion and type safety
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("DVPNClient", () => {
  const DVPN_BASE_URL = "https://api.dvpnsdk.com";
  const FAKE_API_KEY = "test-api-key";
  let originalEnv: NodeJS.ProcessEnv;

  // Safely manage environment variables
  beforeAll(() => {
    originalEnv = { ...process.env };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  // Ensure a clean state for every test
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DVPN_API_KEY = FAKE_API_KEY;
  });

  // --- 1. CONSTRUCTOR TESTS ---
  describe("constructor", () => {
    it("should initialize successfully when DVPN_API_KEY is set", () => {
      expect(() => new DVPNClient()).not.toThrow();
    });

    it("should throw an error if DVPN_API_KEY is not set", () => {
      delete process.env.DVPN_API_KEY;
      expect(() => new DVPNClient()).toThrow(
        "DVPN_API_KEY environment variable is not set."
      );
    });
  });

  // --- 2. API METHOD TESTS ---
  describe("API methods", () => {
    let dVPNClient: DVPNClient;
    beforeEach(() => {
      dVPNClient = new DVPNClient();
    });

    // Test for `createDevice`
    describe("createDevice", () => {
      it("should call axios.post with the correct URL and payload", async () => {
        const mockResponse = { data: { token: "new-device-token" } };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await dVPNClient.createDevice("ios");

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/device`,
          { platform: "ios", app_token: FAKE_API_KEY }
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should handle an empty platform string correctly", async () => {
        mockedAxios.post.mockResolvedValue({ data: {} });
        await dVPNClient.createDevice(); // No platform provided
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/device`,
          { platform: "", app_token: FAKE_API_KEY } // Expects empty string
        );
      });

      it("should propagate errors if axios.post rejects", async () => {
        const apiError = new Error("Network Error");
        mockedAxios.post.mockRejectedValue(apiError);

        // We expect the promise to reject and can even check the error
        await expect(dVPNClient.createDevice("ios")).rejects.toThrow(
          "Network Error"
        );
      });
    });

    // Test for `getCountries`
    describe("getCountries", () => {
      it("should call axios.get with the correct URL and headers", async () => {
        const deviceToken = "test-token";
        const mockResponse = { data: [{ id: "us" }] };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await dVPNClient.getCountries(deviceToken);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/country?filter=WIREGUARD`,
          { headers: { "x-device-token": deviceToken } }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    // Test for `getCities`
    describe("getCities", () => {
      it("should call axios.get with the correct URL, headers, and params", async () => {
        const countryId = "us";
        const deviceToken = "test-token";
        const mockResponse = { data: [{ id: "nyc" }] };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await dVPNClient.getCities(countryId, deviceToken);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/country/${countryId}/city`,
          {
            headers: { "x-device-token": deviceToken },
            params: { filter: "WIREGUARD" },
          }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    // Test for `getServers`
    describe("getServers", () => {
      it("should call axios.get with the correct URL and headers", async () => {
        const cityId = "nyc";
        const deviceToken = "test-token";
        const mockResponse = { data: [{ id: "server-1" }] };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await dVPNClient.getServers(deviceToken, cityId);

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/city/${cityId}/server?filter=WIREGUARD`,
          { headers: { "x-device-token": deviceToken } }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    // Test for `createServerCredentials`
    describe("createServerCredentials", () => {
      it("should call axios.post with the correct URL, an empty body, and headers", async () => {
        const serverId = "server-1";
        const deviceToken = "test-token";
        const mockResponse = { data: { private_key: "key" } };
        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await dVPNClient.createServerCredentials(
          deviceToken,
          serverId
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/server/${serverId}/credentials`,
          {}, // Expecting an empty object as the body
          { headers: { "x-device-token": deviceToken } }
        );
        expect(result).toEqual(mockResponse.data);
      });
    });
    describe("getHealth", () => {
      it("should call axios.get with the correct health check URL", async () => {
        const mockResponse = { status: 200, data: { status: "OK" } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await dVPNClient.getHealth();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(`${DVPN_BASE_URL}/health`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe("getConfig", () => {
      it("should call axios.get with the correct config URL and app_token param", async () => {
        const mockResponse = { data: { some_config: "value" } };
        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await dVPNClient.getConfig();

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${DVPN_BASE_URL}/config`,
          { params: { app_token: FAKE_API_KEY } }
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
