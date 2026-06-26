import { model, Schema } from 'mongoose'
import {
  ILeadModel,
  TLead,
  TVehicleDetails,
  TPropertyDetails,
} from './lead.interface'

const VehicleDetailsSchema = new Schema<TVehicleDetails>(
  {
    vin: { type: String, uppercase: true, trim: true },
    make: { type: String, trim: true },
    model: { type: String, trim: true },
    year: { type: Number },
    isValidVin: { type: Boolean, default: false },
    validationResponse: { type: Schema.Types.Mixed },
  },
  { _id: false },
)

const PropertyDetailsSchema = new Schema<TPropertyDetails>(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true, uppercase: true },
    zipCode: { type: String, required: true },
    yearBuilt: { type: Number },
    squareFootage: { type: Number },
    hasPool: { type: Boolean, default: false },
    hasSecuritySystem: { type: Boolean, default: false },
  },
  { _id: false },
)

const LeadSchema = new Schema<TLead, ILeadModel>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    insuranceType: {
      type: String,
      enum: ['Auto', 'Home', 'Commercial', 'Life', 'Health'],
      required: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Quoted', 'Converted', 'Lost'],
      default: 'New',
    },
    source: {
      type: String,
      enum: ['Phone Call', 'Web', 'Chat', 'Referral'],
      default: 'Phone Call',
    },
    // New fields
    dateOfBirth: {
      type: Date,
      required: false,
    },
    hasDog: {
      type: Boolean,
      default: false,
    },
    numberOfDogs: {
      type: Number,
      min: 0,
      required: false,
    },
    dogBreed: {
      type: String,
      trim: true,
      required: false,
    },
    lastRoofReplaced: {
      type: Date,
      required: false,
    },
    roofAge: {
      type: Number,
      required: false,
    },
    vehicleDetails: VehicleDetailsSchema,
    propertyDetails: PropertyDetailsSchema,
    businessName: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    numberOfEmployees: { type: Number },
    insuredMineId: { type: String },
    hawksoftId: { type: String },
    zapierWorkflowId: { type: String },
    callLogId: { type: Schema.Types.ObjectId, ref: 'CallLog' },
    callSummary: { type: String },
    notes: { type: String },
    syncedToInsuredMine: { type: Boolean, default: false },
    syncedToHawkSoft: { type: Boolean, default: false },
    syncedAt: { type: Date },
    lastError: { type: String },
  },
  {
    timestamps: true,
  },
)

// Pre-save hook to clear dog fields if hasDog is false
LeadSchema.pre('save', function (next) {
  // If hasDog is false or undefined, clear dog-related fields
  if (!this.hasDog) {
    this.numberOfDogs = undefined
    this.dogBreed = undefined
  }
  next()
})

// Indexes for faster lookups
LeadSchema.index({ phone: 1, createdAt: -1 })
LeadSchema.index({ insuredMineId: 1 })
LeadSchema.index({ status: 1 })
LeadSchema.index({ dateOfBirth: 1 }) // Optional: for date-based queries
LeadSchema.index({ hasDog: 1 }) // Optional: for filtering by dog ownership

// Static method to check if phone exists
LeadSchema.statics.isPhoneExists = async function (
  phone: string,
): Promise<boolean> {
  const lead = await this.findOne({ phone })
  return !!lead
}

export const Lead = model<TLead, ILeadModel>('Lead', LeadSchema)
