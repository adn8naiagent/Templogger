import type { User } from "@shared/schema";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    userId?: string;
  }
}

export {};
