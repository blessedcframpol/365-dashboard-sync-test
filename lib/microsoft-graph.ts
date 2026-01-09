import { Client } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'

interface TokenResponse {
  access_token: string
  expires_in: number
}

/**
 * Get access token using client credentials flow
 */
async function getAccessToken(): Promise<string> {
  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Microsoft Graph API credentials')
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data: TokenResponse = await response.json()
  return data.access_token
}

/**
 * Create Microsoft Graph client
 */
export async function createGraphClient(): Promise<Client> {
  const accessToken = await getAccessToken()

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })
}

/**
 * Fetch all users from Microsoft Graph (with pagination support)
 */
export async function fetchUsers() {
  const client = await createGraphClient()
  
  try {
    const allUsers: any[] = []
    let page = await client
      .api('/users')
      .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,accountEnabled,createdDateTime')
      .get()

    // Add first page of users
    if (page.value) {
      allUsers.push(...page.value)
    }

    // Follow pagination links to get all users
    while (page['@odata.nextLink']) {
      page = await client.api(page['@odata.nextLink']).get()
      if (page.value) {
        allUsers.push(...page.value)
      }
    }

    return allUsers
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Fetch user licenses/subscribed SKUs
 */
export async function fetchSubscribedSkus() {
  const client = await createGraphClient()
  
  try {
    const skus = await client
      .api('/subscribedSkus')
      .get()

    return skus.value || []
  } catch (error) {
    console.error('Error fetching subscribed SKUs:', error)
    throw error
  }
}

/**
 * Fetch mailbox usage statistics
 */
export async function fetchMailboxUsage() {
  const client = await createGraphClient()
  
  try {
    const usage = await client
      .api('/reports/getMailboxUsageDetail(period=\'D7\')')
      .get()

    return usage || []
  } catch (error) {
    console.error('Error fetching mailbox usage:', error)
    // This endpoint might require different permissions, so we'll handle gracefully
    return []
  }
}

/**
 * Fetch OneDrive usage statistics
 */
export async function fetchOneDriveUsage() {
  const client = await createGraphClient()
  
  try {
    const usage = await client
      .api('/reports/getOneDriveUsageAccountDetail(period=\'D7\')')
      .get()

    return usage || []
  } catch (error) {
    console.error('Error fetching OneDrive usage:', error)
    // This endpoint might require different permissions, so we'll handle gracefully
    return []
  }
}

