import type { Response } from 'express';
import type { ZodError } from 'zod';

/** 400 in the D-035 shape: one message per field, the first one wins. */
export function validationFailed(res: Response, error: ZodError): void {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0])] ??= issue.message;
  res.status(400).json({
    error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields },
  });
}
