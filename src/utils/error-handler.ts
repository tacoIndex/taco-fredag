import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleApiError = (err: unknown, req: NextApiRequest, res: NextApiResponse) => {
  const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (err instanceof AppError) {
    logger.error("API Error", err, {
      errorId,
      path: req.url,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
    });

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      errorId,
    });
  }

  logger.error("Unexpected API Error", err, {
    errorId,
    path: req.url,
    method: req.method,
  });

  return res.status(500).json({
    error: "Internal Server Error",
    errorId,
  });
};

export const withErrorHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res);
    }
  };
};
