// Augments Express's Request type so authenticated routes can read `req.user`.
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export {};
