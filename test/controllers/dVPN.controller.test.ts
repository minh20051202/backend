import { Request, Response } from "express";
import { DVPNController } from "../../src/controllers/dVPN.controller";
import { DVPNService } from "../../src/services/dVPN.service";

jest.mock("../../src/services/dVPN.service");

describe("DVPNController", () => {
  let dVPNController: DVPNController;
  let mockDVPNService: jest.Mocked<DVPNService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh mock of the DVPNService for each test.
    mockDVPNService = new DVPNService({} as any) as jest.Mocked<DVPNService>;

    // Inject the mock service into controller.
    dVPNController = new DVPNController(mockDVPNService);

    // Create fresh mock Express objects for each test.
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("getActiveDVPN", () => {
    // --- Test Case H1: The Happy Path ---
    it("should call the service and return a 200 status with the config data", async () => {
      // Arrange
      const mockDVPNConfig = {
        config: "...",
        raw: "...",
        city: "Test City",
        server: "Test Server",
      };
      mockDVPNService.getActiveDVPNConfig.mockResolvedValue(mockDVPNConfig);

      // Act
      await dVPNController.getActiveDVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockDVPNService.getActiveDVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDVPNConfig);
    });

    // --- Test Case S1: Handled "Sad Path" (404 Not Found) ---
    it("should return a 404 status if the service throws a 404 HttpError", async () => {
      // Arrange
      const notFoundError = new Error("No countries found");
      (notFoundError as any).statusCode = 404;
      mockDVPNService.getActiveDVPNConfig.mockRejectedValue(notFoundError);

      // Act
      await dVPNController.getActiveDVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockDVPNService.getActiveDVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No countries found",
      });
    });

    // --- Test Case S2: Unhandled "Sad Path" (500 Internal Server Error) ---
    it("should return a 500 status for unexpected, generic errors from the service", async () => {
      // Arrange
      const genericError = new Error("Database connection failed");
      mockDVPNService.getActiveDVPNConfig.mockRejectedValue(genericError);

      // Act
      await dVPNController.getActiveDVPN(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockDVPNService.getActiveDVPNConfig).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get DVPN configuration",
      });
    });
  });
});
