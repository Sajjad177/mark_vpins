import axios from 'axios'
import config from '../config'
import logger from '../logger'

interface HawkSoftClient {
  clientNumber: number
  details: any
  policies?: any[]
  people?: any[]
}

export class HawkSoftService {
  private static baseUrl = config.hawksoftApiUrl
  private static version = config.hawksoftApiVersion

  private static getAuthHeader() {
    const credentials = `${config.hawksoftClientId}:${config.hawksoftClientSecret}`
    const encoded = Buffer.from(credentials).toString('base64')
    return `Basic ${encoded}`
  }

  // Get all agencies subscribed to your integration
  static async getAgencies(): Promise<number[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/vendor/agencies`, {
        params: { version: this.version },
        headers: { Authorization: this.getAuthHeader() },
        timeout: 30000,
      })
      return response.data
    } catch (error: any) {
      logger.error('HawkSoft getAgencies failed:', error.message)
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }

  // Get client details by ID
  static async getClient(
    agencyId: number,
    clientId: number,
  ): Promise<HawkSoftClient> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}`,
        {
          params: { version: this.version },
          headers: { Authorization: this.getAuthHeader() },
          timeout: 30000,
        },
      )
      return response.data
    } catch (error: any) {
      logger.error(`HawkSoft getClient ${clientId} failed:`, error.message)
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }

  // Get list of clients from an agency with pagination
  static async getClientList(
    agencyId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<number[]> {
    // Returns array of client IDs
    try {
      const response = await axios.get(
        `${this.baseUrl}/vendor/agency/${agencyId}/clients`,
        {
          params: {
            version: this.version,
            limit,
            offset,
          },
          headers: { Authorization: this.getAuthHeader() },
          timeout: 30000,
        },
      )
      // The API returns an array of client IDs directly
      return response.data
    } catch (error: any) {
      logger.error('HawkSoft getClientList failed:', error.message)
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }

  // Get changed clients since a timestamp
  static async getChangedClients(
    agencyId: number,
    asOf: Date,
  ): Promise<number[]> {
    try {
      const timestamp = asOf.toISOString()
      const response = await axios.get(
        `${this.baseUrl}/vendor/agency/${agencyId}/clients/changed`,
        {
          params: {
            version: this.version,
            asOf: timestamp,
            deleted: true,
          },
          headers: { Authorization: this.getAuthHeader() },
          timeout: 30000,
        },
      )
      return response.data
    } catch (error: any) {
      logger.error('HawkSoft getChangedClients failed:', error.message)
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }

  // Search for clients by phone or name
  // Note: Since HawkSoft doesn't support server-side filtering by phone/name,
  // we have to fetch details for a subset of clients to find a match.
  static async searchClients(
    agencyId: number,
    query: { phone?: string; name?: string },
    limit: number = 20,
  ): Promise<{ results: any[]; errors: string[] }> {
    try {
      const allClientIds = await this.getClientList(agencyId, limit, 0);
      // Manually respect limit because the HawkSoft API sometimes ignores it
      const clientIds = allClientIds.slice(0, limit);
      const results: any[] = [];
      const errors: string[] = [];
      const chunkSize = 5; // Process in smaller batches to avoid overwhelming the API

      for (let i = 0; i < clientIds.length; i += chunkSize) {
        const chunk = clientIds.slice(i, i + chunkSize);

        const chunkPromises = chunk.map(async (clientId) => {
          try {
            const client = await this.getClient(agencyId, clientId);

            let match = false;

            // Match by phone
            if (query.phone) {
              const searchPhone = query.phone.replace(/\D/g, '');
              const clientPhones = [
                client.details?.homePhone,
                client.details?.workPhone,
                client.details?.mobilePhone,
                ...(client.people?.map((p: any) => p.phone) || [])
              ].filter(Boolean).map((p: string) => p.replace(/\D/g, ''));

              if (clientPhones.some((p: string) => p.includes(searchPhone))) {
                match = true;
              }
            }

            // Match by name
            if (query.name && !match) {
              const searchName = query.name.toLowerCase();
              const clientName = `${client.details?.firstName || ''} ${client.details?.lastName || ''}`.toLowerCase();
              if (clientName.includes(searchName)) {
                match = true;
              }
            }

            return { match: match ? client : null, error: null };
          } catch (error: any) {
            logger.error(error, `Error fetching client ${clientId} during search:`);
            return { match: null, error: error.message || `Failed to fetch client ${clientId}` };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        for (const res of chunkResults) {
          if (res.match) results.push(res.match);
          if (res.error) errors.push(res.error);
        }
      }

      return { results, errors };
    } catch (error: any) {
      logger.error('HawkSoft searchClients failed:', error.message);
      throw new Error(`HawkSoft API error: ${error.message}`);
    }
  }

  // FIXED: Create a log note in HawkSoft
  // Create a log note in HawkSoft
  // Create a log note in HawkSoft
  static async createLogNote(
    agencyId: number,
    clientId: number,
    note: string,
  ): Promise<any> {
    try {
      // Option A: Try without refId
      const payload = {
        action: 29,
        channel: 0,
        description: note.substring(0, 255),
        body: note,
        ts: new Date().toISOString(),
      }

      console.log('HawkSoft createLogNote request (No refId):', {
        url: `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log?version=${this.version}`,
        payload: payload,
      })

      try {
        const response = await axios.post(
          `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log`,
          payload,
          {
            params: { version: this.version },
            headers: {
              Authorization: this.getAuthHeader(),
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        )
        return response.data
      } catch (error: any) {
        // If Option A fails, try Option B
        console.log('Option A failed, trying Option B...')

        // Option B: Try with refId as string
        const payload2 = {
          action: 29,
          channel: 0,
          refId: `LEAD_${Date.now()}`,
          description: note.substring(0, 255),
          body: note,
          ts: new Date().toISOString(),
        }

        console.log('HawkSoft createLogNote request (refId as string):', {
          url: `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log?version=${this.version}`,
          payload: payload2,
        })

        try {
          const response2 = await axios.post(
            `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log`,
            payload2,
            {
              params: { version: this.version },
              headers: {
                Authorization: this.getAuthHeader(),
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          )
          return response2.data
        } catch (error2: any) {
          // If Option B fails, try Option C
          console.log('Option B failed, trying Option C...')

          // Option C: Minimal payload without optional fields
          const payload3 = {
            action: 29,
            description: note.substring(0, 255),
          }

          console.log('HawkSoft createLogNote request (Minimal):', {
            url: `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log?version=${this.version}`,
            payload: payload3,
          })

          const response3 = await axios.post(
            `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/log`,
            payload3,
            {
              params: { version: this.version },
              headers: {
                Authorization: this.getAuthHeader(),
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          )
          return response3.data
        }
      }
    } catch (error: any) {
      if (error.response) {
        console.error('HawkSoft API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        })

        console.error('Request payload that failed:', error.config?.data)

        logger.error(
          {
            status: error.response.status,
            data: error.response.data,
            message: error.message,
          },
          'HawkSoft createLogNote failed:',
        )

        throw new Error(
          `HawkSoft API error: ${error.response.data?.message || error.response.statusText || error.message}`,
        )
      } else if (error.request) {
        console.error('HawkSoft No Response:', error.request)
        throw new Error('HawkSoft API error: No response received')
      } else {
        console.error('HawkSoft Error:', error.message)
        throw new Error(`HawkSoft API error: ${error.message}`)
      }
    }
  }

  // Alternative method: Update client with a note
  static async addClientNote(
    agencyId: number,
    clientId: number,
    note: string,
  ): Promise<any> {
    try {
      // First, get the current client data
      const client = await this.getClient(agencyId, clientId)

      // Prepare the update payload
      const payload = {
        details: {
          ...client.details,
          notes: client.details?.notes
            ? `${client.details.notes}\n\n${note}`
            : note,
        },
      }

      console.log('HawkSoft addClientNote request:', {
        url: `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}?version=${this.version}`,
        payload: payload,
      })

      const response = await axios.patch(
        `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}`,
        payload,
        {
          params: { version: this.version },
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      )
      return response.data
    } catch (error: any) {
      if (error.response) {
        console.error('HawkSoft API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        })
      }
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }

  // Get policies for a specific client
  static async getPolicies(
    agencyId: number,
    clientId: number,
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/vendor/agency/${agencyId}/client/${clientId}/policies`,
        {
          params: { version: this.version },
          headers: { Authorization: this.getAuthHeader() },
          timeout: 30000,
        },
      )
      return response.data
    } catch (error: any) {
      logger.error(`HawkSoft getPolicies for client ${clientId} failed:`, error.message)
      // Some versions of the API might return policies within the client details instead
      try {
        const client = await this.getClient(agencyId, clientId)
        return client.policies || []
      } catch (innerError) {
        throw new Error(`HawkSoft API error: ${error.message}`)
      }
    }
  }

  // Get policy details by policy number across the agency
  static async getPolicyByNumber(
    agencyId: number,
    policyNumber: string,
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/vendor/agency/${agencyId}/clients/search`,
        {
          params: {
            version: this.version,
            policyNumber: policyNumber,
            include: 'details,policies'
          },
          headers: { Authorization: this.getAuthHeader() },
          timeout: 30000,
        },
      )

      // The search might return multiple clients if they share a policy number (rare but possible)
      // Or it might return the policy data structure directly depending on the version
      return response.data
    } catch (error: any) {
      logger.error(`HawkSoft getPolicyByNumber ${policyNumber} failed:`, error.message)
      throw new Error(`HawkSoft API error: ${error.message}`)
    }
  }
}
