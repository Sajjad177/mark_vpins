import { z } from 'zod'

// Vehicle details validation
const vehicleDetailsSchema = z.object({
  vin: z.string().min(17).max(17).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z
    .number()
    .min(1886)
    .max(new Date().getFullYear() + 1)
    .optional(),
  isValidVin: z.boolean().optional(),
  validationResponse: z.any().optional(),
})

// Property details validation
const propertyDetailsSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(5).max(10),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  squareFootage: z.number().min(0).optional(),
  hasPool: z.boolean().optional(),
  hasSecuritySystem: z.boolean().optional(),
})

// Create lead validation
export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional(),
    insuranceType: z.enum(['Auto', 'Home', 'Commercial', 'Life', 'Health']),
    source: z
      .enum(['Phone Call', 'Web', 'Chat', 'Referral'])
      .optional()
      .default('Phone Call'),

    // Auto insurance fields
    vehicleDetails: vehicleDetailsSchema.optional(),

    // Home insurance fields
    propertyDetails: propertyDetailsSchema.optional(),

    // Commercial insurance fields
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    numberOfEmployees: z.number().min(1).optional(),

    notes: z.string().optional(),
    callLogId: z.string().optional(),
    callSummary: z.string().optional(),
    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    hasDog: z.boolean().optional().default(false),
    numberOfDogs: z.number().int().min(0).optional(),
    dogBreed: z.string().trim().optional(),
    lastRoofReplaced: z
      .string()
      .optional()
      .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    roofAge: z.number().int().min(0).optional(),
  }),
})

// Update lead validation
export const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(10).max(15).optional(),
    email: z.string().email().optional(),
    insuranceType: z
      .enum(['Auto', 'Home', 'Commercial', 'Life', 'Health'])
      .optional(),
    status: z
      .enum(['New', 'Contacted', 'Quoted', 'Converted', 'Lost'])
      .optional(),
    vehicleDetails: vehicleDetailsSchema.optional(),
    propertyDetails: propertyDetailsSchema.optional(),
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    numberOfEmployees: z.number().min(1).optional(),
    notes: z.string().optional(),
    callSummary: z.string().optional(),
    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    hasDog: z.boolean().optional(),
    numberOfDogs: z.number().int().min(0).optional(),
    dogBreed: z.string().trim().optional(),
    lastRoofReplaced: z
      .string()
      .optional()
      .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    roofAge: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
})

// Get lead by phone validation
export const getLeadByPhoneSchema = z.object({
  params: z.object({
    phone: z.string().min(10).max(15),
  }),
})

// VIN validation schema
export const validateVinSchema = z.object({
  body: z.object({
    vin: z.string().length(17).toUpperCase(),
  }),
})

export type TCreateLeadInput = z.infer<typeof createLeadSchema>['body']
export type TUpdateLeadInput = z.infer<typeof updateLeadSchema>['body']
