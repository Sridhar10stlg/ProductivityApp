import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors,
    });
    return;
  }

  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
