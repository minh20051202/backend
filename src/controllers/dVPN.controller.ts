import { Request, Response } from "express";
import { DVPNService } from "../services/dVPN.service";

export class DVPNController {
  private vpnService: DVPNService;

  // Inject the DVPNService as a dependency
  constructor(vpnService: DVPNService) {
    this.vpnService = vpnService;
  }
  /**
   * Handles the request to get the active DVPN configuration.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  public getActiveDVPN = async (req: Request, res: Response) => {
    try {
      const vpnConfig = await this.vpnService.getActiveDVPNConfig();
      return res.json(vpnConfig);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error(err?.response?.data || err);
      return res
        .status(500)
        .json({ error: "Failed to get DVPN configuration" });
    }
  };
}
