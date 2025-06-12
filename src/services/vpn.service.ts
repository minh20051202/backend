import { DVPNClient } from '../clients/dVPN.client';

// A custom error class to help us pass HTTP status codes from the service to the controller
class HttpError extends Error {
    public statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class VPNService {
    private dVPNClient: DVPNClient;

    // We inject the low-level dVPNClient as a dependency
    constructor(dVPNClient: DVPNClient) {
        this.dVPNClient = dVPNClient;
    }

    /**
     * Orchestrates the entire process of getting an active VPN configuration.
     */
    public async getActiveVPNConfig() {
        // Step 1: Create device
        const deviceInfo = await this.dVPNClient.createDevice();
        const deviceToken = deviceInfo.data.token;

        // Step 2: Find countries
        const countries = await this.dVPNClient.getCountries(deviceToken);
        if (countries.data.length === 0) {
            throw new HttpError('No countries found', 404);
        }

        // Step 3: Find cities
        const firstCountry = countries.data[0];
        const cities = await this.dVPNClient.getCities(firstCountry.id, deviceToken);
        if (cities.data.length === 0) {
            throw new HttpError('No cities found', 404);
        }

        // Step 4: Find servers
        const firstCity = cities.data[0];
        const servers = await this.dVPNClient.getServers(deviceToken, firstCity.id);
        if (servers.data.length === 0) {
            throw new HttpError('No servers found', 404);
        }

        // Step 5: Get credentials and build config
        const firstServer = servers.data[0];
        const credentials = await this.dVPNClient.createServerCredentials(deviceToken, firstServer.id);
        const configText = this.buildWireGuardConf(credentials.data);
        
        // Final Step: Return a clean data object
        return {
            config: configText,
            raw: credentials,
            city: firstCity.name,
            server: firstServer.name,
        };
    }

    private buildWireGuardConf(data: any): string {
        const privateKey = data.private_key || '';
        const address = data.address || '10.0.0.2/32';
        const dns = data.dns || '1.1.1.1';
        const serverPublicKey = data.server_public_key || '';

        let endpoint = '';
        if (data.remote_url) {
            endpoint = data.remote_url.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        } else if (data.server?.remote_url) {
            endpoint = data.server.remote_url.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        } else {
            endpoint = 'endpoint.example.com:51820';
        }

        return `[Interface]
    PrivateKey = ${privateKey}
    Address = ${address}
    ListenPort = 51820
    DNS = ${dns}
    
    [Peer]
    PublicKey = ${serverPublicKey}
    Endpoint = ${endpoint}
    AllowedIPs = 0.0.0.0/0
    PersistentKeepalive = 20
    `;
    }
}