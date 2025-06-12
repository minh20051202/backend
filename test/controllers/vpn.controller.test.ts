import { Request, Response } from "express";
import { VPNController } from "../../src/controllers/vpn.controller";
import { VPNService } from "../../src/services/vpn.service";

jest.mock("../../src/services/vpn.service");

describe("VPNController", () => {
  let vpnController: VPNController;
  let mockVPNService: jest.Mocked<VPNService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh mock of the VPNService for each test.
    mockVPNService = new VPNService({} as any) as jest.Mocked<VPNService>;

    // Inject the mock service into controller.
    vpnController = new VPNController(mockVPNService);

    // Create fresh mock Express objects for each test.
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("getActiveVPN", () => {
    // --- Test Case H1: The Happy Path ---
    it("should call the service and return a 200 status with the config data", async () => {
      // Arrange
      const mockVPNConfig = {
        config: "...",
        raw: "...",
        city: "Test City",
        server: "Test Server",
      };
      mockVPNService.getActiveVPNConfig.mockResolvedValue(mockVPNConfig);

      // Act
      await vpnController.getActiveVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVPNService.getActiveVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockVPNConfig);
    });

    // --- Test Case S1: Handled "Sad Path" (404 Not Found) ---
    it("should return a 404 status if the service throws a 404 HttpError", async () => {
      // Arrange
      const notFoundError = new Error("No countries found");
      (notFoundError as any).statusCode = 404;
      mockVPNService.getActiveVPNConfig.mockRejectedValue(notFoundError);

      // Act
      await vpnController.getActiveVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVPNService.getActiveVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No countries found",
      });
    });

    // --- Test Case S2: Unhandled "Sad Path" (500 Internal Server Error) ---
    it("should return a 500 status for unexpected, generic errors from the service", async () => {
      // Arrange
      const genericError = new Error("Database connection failed");
      mockVPNService.getActiveVPNConfig.mockRejectedValue(genericError);

      // Act
      await vpnController.getActiveVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockVPNService.getActiveVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get VPN configuration",
      });
    });
  });
});
