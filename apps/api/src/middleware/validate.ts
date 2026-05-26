import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query
    });

    if (!result.success) {
      return response.status(422).json({
        message: "Validation failed",
        errors: result.error.flatten()
      });
    }

    response.locals.validated = result.data;
    return next();
  };
}
