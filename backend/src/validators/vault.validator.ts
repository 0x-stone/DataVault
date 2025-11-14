import { z } from "zod";

export const registerVaultSchema = z.object({
  fullname: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
});

export const DocumentUploadSchema = z.object({
  documentType: z.enum(['nin_front', 'nin_back', 'passport', 'utility_bill', 'driver_license']),
});


export const PersonalDataUploadSchema = z.object({
  bvn: z
    .string()
    .length(11, { message: 'BVN must be exactly 11 digits' })
    .regex(/^\d+$/, { message: 'BVN must contain only numbers' })
    .optional(),

  nin: z
    .string()
    .length(11, { message: 'NIN must be exactly 11 digits' })
    .regex(/^\d+$/, { message: 'NIN must contain only numbers' })
    .optional(),

  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date of birth must be in YYYY-MM-DD format' })
    .optional(),

  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters long' })
    .optional(),
});


const validAuthorizationRequestData = ['email', 'phone', 'address', 'fullname', 'nin_front', 'nin_back', 'passport', 'utility_bill', 'bvn', 'nin', 'dob', 'address', 'driver_license']

export const VaultAuthorizationRequestSchema = z.object({
  client_id: z
    .string()
    .min(1, "client_id is required"),

  requested_data: z
    .string()
    .transform((val) => val.split(","))
    .refine(
      (arr) => arr.every((item) => validAuthorizationRequestData.includes(item as any)),
      `requested_data contains invalid fields. Allowed fields: ${validAuthorizationRequestData.join(", ")}`
    )
    .refine((arr) => arr.length > 0, "At least one requested data field is required"),

  purpose: z
    .string()
    .min(10, "Purpose must be descriptive (at least 10 characters)")
    .max(300, "Purpose too long"),

  duration: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine(
      (num) => !isNaN(num) && num > 0 && num <= 31536000, // 1 year = 365 * 24 * 60 * 60
      "Duration must be a positive number and less than or equal to 1 year (in seconds)"
    ),

  redirect_uri: z
    .url("redirect_uri must be a valid URL")
    .refine(
      (uri) => uri.startsWith("https://"),
      "redirect_uri must use HTTPS for security"
    ),

  state: z
    .string()
    .min(8, "State must be at least 8 characters long")
    .max(128, "State too long")
    .regex(/^[A-Za-z0-9-_]+$/, "State contains invalid characters")
    .optional(),
});

export const VaultAuthorizationTokenSchema = z.object({
  client_id: z
    .string()
    .min(1, "client_id is required"),

  code: z
    .string()
    .min(1, "code is required"),
  })

export const VaultAuthorizationDataSchema = z.object({
  client_id: z
    .string()
    .min(1, "client_id is required"),
  })

export type VaultAuthorizationRequestInput= z.infer<typeof VaultAuthorizationRequestSchema>
export type PersonalDataUploadInput = z.infer<typeof PersonalDataUploadSchema>;
export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>
export type RegisterVaultInput = z.infer<typeof registerVaultSchema>;
