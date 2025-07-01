import express, { Request, Response } from "express";
import { DVPNController } from "./controllers/dVPN.controller";

// export interface AppControllers {
//   vpnController: DVPNController;
//   orderController: OrderController;
//   ...etc
// }

// This function builds the app and wires up the routes.
// replace DVPNController with AppControllers for future refactoring
export const createApp = (controllers: DVPNController): express.Application => {
  const app = express();

  app.use(express.json());

  app.get("/vpn/active", controllers.getActiveDVPN);

  app.get("/health", (req: Request, res: Response) => res.send("OK"));

  return app;
};
