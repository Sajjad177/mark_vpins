import { Model, Types } from 'mongoose'

export type TInsuranceType = 'Auto' | 'Home' | 'Commercial' | 'Life' | 'Health'
export type TLeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Converted' | 'Lost'
export type TLeadSource = 'Phone Call' | 'Web' | 'Chat' | 'Referral'

export interface TVehicleDetails {
  vin: string
  make?: string
  model?: string
  year?: number
  isValidVin?: boolean
  validationResponse?: any
}

export interface TPropertyDetails {
  address: string
  city: string
  state: string
  zipCode: string
  yearBuilt?: number
  squareFootage?: number
  hasPool?: boolean
  hasSecuritySystem?: boolean
}

export interface TLead {
  _id?: Types.ObjectId
  // Customer Info
  name: string
  phone: string
  email?: string

  // Insurance Info
  insuranceType: TInsuranceType
  status: TLeadStatus
  source: TLeadSource

  // Vehicle Insurance Fields
  vehicleDetails?: TVehicleDetails

  // Home Insurance Fields
  propertyDetails?: TPropertyDetails

  // Commercial Insurance Fields
  businessName?: string
  businessAddress?: string
  numberOfEmployees?: number

  // System Fields
  insuredMineId?: string
  hawksoftId?: string
  zapierWorkflowId?: string
  callLogId?: Types.ObjectId
  callSummary?: string

  // Meta
  notes?: string
  syncedToInsuredMine: boolean
  syncedToHawkSoft: boolean
  syncedAt?: Date
  lastError?: string

  // Timestamps
  createdAt?: Date
  updatedAt?: Date

  dateOfBirth?: Date
  hasDog?: boolean
  numberOfDogs?: number
  dogBreed?: string
  lastRoofReplaced?: Date
  roofAge?: number
}

export interface ILeadModel extends Model<TLead> {
  isPhoneExists(phone: string): Promise<boolean>
}
