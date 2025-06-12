import { Request, Response } from 'express';
import { VPNService } from '../services/vpn.service';

export class VPNController {
    private vpnService: VPNService;

    // We inject the VPNService as a dependency
    constructor(vpnService: VPNService) {
        this.vpnService = vpnService;
    }

    /**
     * Handles the HTTP request for GET /vpn/active.
     * We use an arrow function to ensure `this` is correctly bound.
     */
    public getActiveVPN = async (req: Request, res: Response) => {
        try {
            // Delegate all the hard work to the service
            const vpnConfig = await this.vpnService.getActiveVPNConfig();
            return res.json(vpnConfig);
        } catch (err: any) {
            // Check if it's our custom HttpError with a specific status
            if (err.statusCode) {
                return res.status(err.statusCode).json({ error: err.message });
            }
            
            // Handle any other unexpected errors
            console.error(err?.response?.data || err);
            return res.status(500).json({ error: 'Failed to get VPN configuration' });
        }
    }
}