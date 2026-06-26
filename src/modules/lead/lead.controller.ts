import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { LeadService } from './lead.service'

const createLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await LeadService.createLead(req.body)

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Lead created successfully',
    data: lead,
  })
})

const getAllLeads = catchAsync(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, insuranceType } = req.query
  const result = await LeadService.getAllLeads({
    page: Number(page),
    limit: Number(limit),
    status: status as string,
    insuranceType: insuranceType as string,
  })

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Leads retrieved successfully',
    data: result,
  })
})

const getLeadById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const lead = await LeadService.getLeadById(id)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead retrieved successfully',
    data: lead,
  })
})

const getLeadByPhone = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.params
  const lead = await LeadService.getLeadByPhone(phone)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead retrieved successfully',
    data: lead,
  })
})

const updateLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const lead = await LeadService.updateLead(id, req.body)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead updated successfully',
    data: lead,
  })
})

const deleteLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  await LeadService.deleteLead(id)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lead deleted successfully',
    data: null,
  })
})


const syncToHawkSoft = LeadService.syncToHawkSoft

export const LeadController = {
  createLead,
  getAllLeads,
  getLeadById,
  getLeadByPhone,
  updateLead,
  deleteLead,
  // syncToInsuredMine,
  syncToHawkSoft,
}
