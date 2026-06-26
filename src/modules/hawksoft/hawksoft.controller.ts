import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { HawkSoftService } from '../../services/hawksoft.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';

const getAgencies = catchAsync(async (req: Request, res: Response) => {
    const result = await HawkSoftService.getAgencies();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Agencies retrieved successfully',
        data: result,
    });
});

const getClientPolicies = catchAsync(async (req: Request, res: Response) => {
    const agencyId = req.params.agencyId || '17837';
    const { clientId } = req.params;

    if (!clientId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Client ID is required',
        });
    }

    try {
        const result = await HawkSoftService.getPolicies(Number(agencyId), Number(clientId));

        if (!result || (Array.isArray(result) && result.length === 0)) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'No policies found for this client',
            });
        }

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Client policies retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message || 'Error retrieving client policies',
        });
    }
});

const getPolicyByNumber = catchAsync(async (req: Request, res: Response) => {
  const agencyId = req.query.agencyId || '17837'
  const policyNumber = req.query.policyNumber as string

  if (!policyNumber) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Policy Number is required',
    })
  }

  try {
    const result = await HawkSoftService.getPolicyByNumber(
      Number(agencyId),
      policyNumber,
    )

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'No policy found matching the policy number',
      })
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Policy information retrieved successfully',
      data: result,
    })
  } catch (error: any) {
    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || 'Error retrieving policy information',
    })
  }
})

const getClient = catchAsync(async (req: Request, res: Response) => {
    const agencyId = req.params.agencyId || '17837';
    const { clientId } = req.params;

    if (!clientId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Client ID is required',
        });
    }

    try {
        const result = await HawkSoftService.getClient(Number(agencyId), Number(clientId));
        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Client details retrieved successfully',
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: error.message || 'Client not found',
        });
    }
});

const searchClients = catchAsync(async (req: Request, res: Response) => {
    const agencyId = req.params.agencyId || '17837';
    const { phone, name, limit } = req.query;

    if (!agencyId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Agency ID is required',
        });
    }

    const { results, errors } = await HawkSoftService.searchClients(
        Number(agencyId),
        { phone: phone as string, name: name as string },
        limit ? Number(limit) : 20
    );

    if (results.length === 0) {
        let errorMessage = 'No clients found matching the search criteria.';
        if (errors.length > 0) {
            errorMessage += ` (Note: ${errors.length} partial errors occurred during search).`;
        }
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: errorMessage,
        });
    }

    let message = 'Clients searched successfully';
    if (errors.length > 0) {
        message = `Search completed with ${errors.length} partial errors (e.g. timeouts). Found ${results.length} matches. Results might be incomplete.`;
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message,
        data: results,
    });
});

export const HawkSoftController = {
    getAgencies,
    getClientPolicies,
    getPolicyByNumber,
    getClient,
    searchClients,
};
