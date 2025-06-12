import { Request, Response } from "express";
import { VPNService } from "../services/vpn.service";

export class VPNController {
  private vpnService: VPNService;

  // Inject the VPNService as a dependency
  constructor(vpnService: VPNService) {
    this.vpnService = vpnService;
  }
  /**
   * Handles the request to get the active VPN configuration.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  public getActiveVPN = async (req: Request, res: Response) => {
    try {
      const vpnConfig = await this.vpnService.getActiveVPNConfig();
      return res.json(vpnConfig);
    } catch (err: any) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error(err?.response?.data || err);
      return res.status(500).json({ error: "Failed to get VPN configuration" });
    }
  };
}
