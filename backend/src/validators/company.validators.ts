import { z } from 'zod'

export const  companyRegisterSchema= z.object({
    companyName:z
    .string()
    .min(4, 'Company name must be  at least 4 characters long'),
    email: z
    .email(),
    password: z
    .string()
    .min(8, 'Password must be  at least 8 characters long')
    .max(32),

})

export const companySaveData = z.object({
    companyName:z
    .string()
    .min(4, 'Company name must be  at least 4 characters long')
    .optional(),
    email: z
    .email()
    .optional(),
    redirectUris: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val, ctx) => {
      if (!val) return []
      let uris: string[]
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (!Array.isArray(parsed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "redirectUris must be a JSON array of strings",
            });
            return z.NEVER;
          }
          uris = parsed;
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "redirectUris must be valid JSON (e.g. '[\"https://example.com\"]')",
          });
          return z.NEVER;
        }
      } else {
        uris = val;
      }

      for (const uri of uris) {
        if (typeof uri !== "string" || !/^https?:\/\/[^\s]+$/.test(uri)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid URL: ${uri}`,
          });
          return z.NEVER;
        }
      }

      return uris;
    }),
    webhookUrl:z
    .url()
    .optional(),
})

export const companyDataRequestSchema = z.object({
  company_id: z.uuidv4(),
});

export const apiKeySchema = z.object({
  name: z
  .string()
  .min(3, 'name must be  at least 3 characters long')
  .max(25, 'name must be  at most 25 characters long')
})