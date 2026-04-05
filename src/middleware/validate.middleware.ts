import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Factory that returns an Express middleware validating req.body / .params / .query
 * against a Zod schema.  Coerced values are written back onto the request so
 * controllers receive correctly-typed data (e.g. query strings converted to numbers).
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined)
        req.params = parsed.params as Record<string, string>;
      // cast through unknown to satisfy Express's ParsedQs type
      if (parsed.query !== undefined)
        req.query = parsed.query as unknown as typeof req.query;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.slice(1).join("."), // strip the leading 'body'/'query'/'params' segment
          message: e.message,
        }));
        res
          .status(400)
          .json({ success: false, message: "Validation failed", errors });
        return;
      }
      next(err);
    }
  };
