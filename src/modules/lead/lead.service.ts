import httpStatus from 'http-status'
import mongoose from 'mongoose'
import AppError from '../../errors/AppError'
import { Lead } from './lead.model'
import { TCreateLeadInput, TUpdateLeadInput } from './lead.validation'
import { TLead } from './lead.interface'
import { HawkSoftService } from '../../services/hawksoft.service'
import logger from '../../logger'
import sendResponse from '../../utils/sendResponse'
import catchAsync from '../../utils/catchAsync'
import { Request, Response } from 'express'

const createLead = async (payload: TCreateLeadInput): Promise<TLead> => {
  // Check if lead with same phone already exists
  const existingLead = await Lead.findOne({ phone: payload.phone })

  if (existingLead) {
    throw new AppError(
      'Lead with this phone number already exists', // message first
      httpStatus.CONFLICT, // status code second
    )
  }
  const lead = await Lead.create(payload)
  return lead
}

const getAllLeads = async (filters: {
  page: number
  limit: number
  status?: string
  insuranceType?: string
}) => {
  const { page, limit, status, insuranceType } = filters
  const skip = (page - 1) * limit

  const query: any = {}
  if (status) query.status = status
  if (insuranceType) query.insuranceType = insuranceType

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('callLogId'),
    Lead.countDocuments(query),
  ])

  return {
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

const getLeadById = async (id: string): Promise<TLead> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid lead ID', httpStatus.BAD_REQUEST)
  }

  const lead = await Lead.findById(id).populate('callLogId')

  if (!lead) {
    throw new AppError('Lead not found', httpStatus.NOT_FOUND)
  }


  return lead
}

const getLeadByPhone = async (phone: string): Promise<TLead | null> => {
  const lead = await Lead.findOne({ phone }).populate('callLogId')
  return lead
}

const updateLead = async (
  id: string,
  payload: TUpdateLeadInput,
): Promise<TLead> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid lead ID', httpStatus.BAD_REQUEST)
  }

  const lead = await Lead.findByIdAndUpdate(
    id,
    { ...payload, updatedAt: new Date() },
    { new: true, runValidators: true },
  )

  if (!lead) {
    throw new AppError('Lead not found', httpStatus.NOT_FOUND)
  }

  return lead
}

const deleteLead = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid lead ID', httpStatus.BAD_REQUEST)
  }

  const result = await Lead.findByIdAndDelete(id)

  if (!result) {
    throw new AppError('Lead not found', httpStatus.NOT_FOUND)
  }
}

const syncToHawkSoft = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params

  // Get lead from database
  const lead = await Lead.findById(id)
  if (!lead) {
    throw new AppError('Lead not found', httpStatus.NOT_FOUND)
  }

  // Get HawkSoft agency ID
  const agencies = await HawkSoftService.getAgencies()
  console.log('HawkSoft Agencies:', agencies)

  if (agencies.length === 0) {
    throw new AppError('No HawkSoft agencies available', httpStatus.BAD_REQUEST)
  }
  const agencyId = agencies[0]
  console.log('Using Agency ID:', agencyId)

  // Get client list - returns array of client IDs
  const clientIds = await HawkSoftService.getClientList(agencyId, 10, 0)
  console.log('Available Client IDs (first 5):', clientIds.slice(0, 5))

  if (!clientIds || clientIds.length === 0) {
    throw new AppError(
      'No clients found in HawkSoft agency',
      httpStatus.BAD_REQUEST,
    )
  }

  // Use the first client ID
  const clientId = clientIds[0]
  console.log('Using Client ID for log note:', clientId)

  // Format the note with lead information
  const noteData = `
New Lead from AI Receptionist
─────────────────────────────
Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email || 'N/A'}
Insurance Type: ${lead.insuranceType}
${lead.dateOfBirth ? `DOB: ${new Date(lead.dateOfBirth).toLocaleDateString()}` : ''}
${lead.hasDog ? `Dog: Yes (${lead.numberOfDogs || 1} ${lead.dogBreed || 'Unknown Breed'})` : ''}
${lead.lastRoofReplaced ? `Roof Replaced: ${new Date(lead.lastRoofReplaced).toLocaleDateString()}` : ''}
${lead.roofAge ? `Roof Age: ${lead.roofAge} years` : ''}
${lead.vehicleDetails?.vin ? `VIN: ${lead.vehicleDetails.vin}` : ''}
${lead.propertyDetails?.address ? `Property: ${lead.propertyDetails.address}, ${lead.propertyDetails.city}, ${lead.propertyDetails.state} ${lead.propertyDetails.zipCode}` : ''}
${lead.notes ? `\nNotes: ${lead.notes}` : ''}
─────────────────────────────
${new Date().toLocaleString()}
  `.trim()

  // Create the log note
  await HawkSoftService.createLogNote(agencyId, clientId, noteData)

  // Update lead with sync status
  const updatedLead = await Lead.findByIdAndUpdate(
    id,
    {
      hawksoftId: `HS_${Date.now()}`,
      syncedToHawkSoft: true,
      syncedAt: new Date(),
    },
    { new: true },
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead synced to HawkSoft successfully',
    data: updatedLead,
  })
})

export const LeadService = {
  createLead,
  getAllLeads,
  getLeadById,
  getLeadByPhone,
  updateLead,
  deleteLead,
  syncToHawkSoft,
}
