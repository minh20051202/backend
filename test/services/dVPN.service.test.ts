import { DVPNService } from "../../src/services/dVPN.service";
import { DVPNClient } from "../../src/clients/dVPN.client";

jest.mock("../../src/clients/dVPN.client");

describe("VPNService", () => {
  let vpnService: DVPNService;
  let mockDVPNClient: jest.Mocked<DVPNClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh mock of the DVPNClient for each test.
    mockDVPNClient = new DVPNClient() as jest.Mocked<DVPNClient>;
    vpnService = new DVPNService(mockDVPNClient);
  });

  describe("getActiveVPNConfig", () => {
    // --- Test Case H1: The Happy Path ---
    it("should orchestrate all client calls correctly and return a shaped config object on success", async () => {
      // Arrange
      const mockDevice = { data: { token: "test-device-token" } };
      const mockCountries = { data: [{ id: "us", name: "USA" }] };
      const mockCities = { data: [{ id: "nyc", name: "New York" }] };
      const mockServers = { data: [{ id: "server-123", name: "NY-VPN-01" }] };
      const mockCredentials = { data: { private_key: "PRIVATE_KEY_123" } };

      mockDVPNClient.createDevice.mockResolvedValue(mockDevice);
      mockDVPNClient.getCountries.mockResolvedValue(mockCountries);
      mockDVPNClient.getCities.mockResolvedValue(mockCities);
      mockDVPNClient.getServers.mockResolvedValue(mockServers);
      mockDVPNClient.createServerCredentials.mockResolvedValue(mockCredentials);

      // Act
      const result = await vpnService.getActiveDVPNConfig();

      // Assert
      expect(mockDVPNClient.getCountries).toHaveBeenCalledWith(
        "test-device-token"
      );
      expect(mockDVPNClient.getCities).toHaveBeenCalledWith(
        "us",
        "test-device-token"
      );
      expect(result).toHaveProperty("city", "New York");
      expect(result.config).toContain("PrivateKey = PRIVATE_KEY_123");
    });

    // --- Test Case S1: Promise Rejection at the start of the chain ---
    it("should propagate an error if the first call to createDevice fails", async () => {
      // Arrange: Mock the very first step to fail
      const networkError = new Error("API is down");
      mockDVPNClient.createDevice.mockRejectedValue(networkError);

      // Act & Assert
      await expect(vpnService.getActiveDVPNConfig()).rejects.toThrow(
        "API is down"
      );

      // Assert
      expect(mockDVPNClient.getCountries).not.toHaveBeenCalled();
    });

    // --- Test Case S2: Business Logic Failure (No Countries) ---
    it("should throw a 404 HttpError if no countries are found", async () => {
      // Arrange
      const mockDevice = { data: { token: "test-device-token" } };
      mockDVPNClient.createDevice.mockResolvedValue(mockDevice);
      mockDVPNClient.getCountries.mockResolvedValue({ data: [] }); // The failure point

      // Act & Assert
      await expect(vpnService.getActiveDVPNConfig()).rejects.toHaveProperty(
        "statusCode",
        404
      );

      // Assert
      expect(mockDVPNClient.getCities).not.toHaveBeenCalled();
    });

    // --- Test Case S3: Business Logic Failure (No Cities) ---
    it("should throw a 404 HttpError if no cities are found", async () => {
      // Arrange
      const mockDevice = { data: { token: "test-device-token" } };
      const mockCountries = { data: [{ id: "us", name: "USA" }] };
      mockDVPNClient.createDevice.mockResolvedValue(mockDevice);
      mockDVPNClient.getCountries.mockResolvedValue(mockCountries);
      mockDVPNClient.getCities.mockResolvedValue({ data: [] }); // The failure point

      // Act & Assert
      await expect(vpnService.getActiveDVPNConfig()).rejects.toThrow(
        "No cities found"
      );
      await expect(vpnService.getActiveDVPNConfig()).rejects.toHaveProperty(
        "statusCode",
        404
      );

      // Assert
      expect(mockDVPNClient.getServers).not.toHaveBeenCalled();
    });

    // --- Test Case S4: Business Logic Failure (No Servers) ---
    it("should throw a 404 HttpError if no servers are found", async () => {
      // Arrange
      const mockDevice = { data: { token: "test-device-token" } };
      const mockCountries = { data: [{ id: "us", name: "USA" }] };
      const mockCities = { data: [{ id: "nyc", name: "New York" }] };
      mockDVPNClient.createDevice.mockResolvedValue(mockDevice);
      mockDVPNClient.getCountries.mockResolvedValue(mockCountries);
      mockDVPNClient.getCities.mockResolvedValue(mockCities);
      mockDVPNClient.getServers.mockResolvedValue({ data: [] }); // The failure point

      // Act & Assert
      await expect(vpnService.getActiveDVPNConfig()).rejects.toThrow(
        "No servers found"
      );
      await expect(vpnService.getActiveDVPNConfig()).rejects.toHaveProperty(
        "statusCode",
        404
      );

      // Assert
      expect(mockDVPNClient.createServerCredentials).not.toHaveBeenCalled();
    });
  });
});
