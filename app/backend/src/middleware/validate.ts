import { Request, Response, NextFunction } from "express"
import { z, ZodError, ZodIssue } from "zod"

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }))

        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        })
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error during validation",
        })
      }
    }
  }
