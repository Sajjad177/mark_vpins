import express from 'express';
import { HawkSoftController } from './hawksoft.controller';
import auth from '../../middleware/auth';

const router = express.Router();

// Get list of agencies
router.get('/agencies', HawkSoftController.getAgencies);

// Get client details (Agency defaults to 17837)
router.get('/agency/:agencyId/client/:clientId', HawkSoftController.getClient);
router.get('/client/:clientId', HawkSoftController.getClient);

// Get policies for a client (Agency defaults to 17837)
router.get('/agency/:agencyId/client/:clientId/policies', HawkSoftController.getClientPolicies);
router.get('/client/:clientId/policies', HawkSoftController.getClientPolicies);

// Search policy by number (Agency defaults to 17837)
router.get('/agency/:agencyId/policy/:policyNumber', HawkSoftController.getPolicyByNumber);
router.get('/policy', HawkSoftController.getPolicyByNumber)

// Search clients by name or phone (Agency defaults to 17837)
router.get('/agency/:agencyId/search', HawkSoftController.searchClients);
router.get('/search', HawkSoftController.searchClients);

export const HawkSoftRouter = router;
