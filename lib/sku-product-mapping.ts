/**
 * SKU Part Number to Product Name Mapping
 * 
 * This mapping is based on Microsoft's official licensing service plan reference:
 * https://learn.microsoft.com/en-us/entra/identity/users/licensing-service-plan-reference
 * 
 * The system uses a database table (sku_product_mappings) for lookups, with this code mapping
 * as a fallback. This allows for easy updates without code deployments.
 */

import { supabaseAdmin } from './supabase'

// In-memory cache for SKU mappings (refreshed periodically)
let skuMappingCache: Map<string, string> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Maps SKU part numbers to their corresponding product display names
 * This is a comprehensive mapping based on Microsoft's official reference
 */
export const SKU_PRODUCT_MAPPING: Record<string, string> = {
  // Microsoft 365 Plans
  'ENTERPRISEPACK': 'Microsoft 365 E3',
  'ENTERPRISEPREMIUM': 'Microsoft 365 E5',
  'DEVELOPERPACK': 'Microsoft 365 Developer',
  'M365EDU_A3_FACULTY': 'Microsoft 365 A3 for Faculty',
  'M365EDU_A3_STUDENT': 'Microsoft 365 A3 for Students',
  'M365EDU_A5_FACULTY': 'Microsoft 365 A5 for Faculty',
  'M365EDU_A5_STUDENT': 'Microsoft 365 A5 for Students',
  'M365_BUSINESS_PREMIUM': 'Microsoft 365 Business Premium',
  'M365_BUSINESS_STANDARD': 'Microsoft 365 Business Standard',
  'M365_BUSINESS_BASIC': 'Microsoft 365 Business Basic',
  'O365_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Essentials',
  'O365_BUSINESS_PREMIUM': 'Microsoft 365 Business Premium',
  'O365_BUSINESS': 'Microsoft 365 Business',
  'SPB': 'Microsoft 365 Business Premium',
  'SPE_E3': 'Microsoft 365 E3',
  'SPE_E5': 'Microsoft 365 E5',
  'SPE_F1': 'Microsoft 365 F1',
  'SPE_F3': 'Microsoft 365 F3',
  
  // Office 365 Plans
  'O365_E1': 'Office 365 E1',
  'O365_E3': 'Office 365 E3',
  'O365_E5': 'Office 365 E5',
  'O365_F1': 'Office 365 F1',
  'O365_F3': 'Office 365 F3',
  'STANDARDPACK': 'Office 365 E1',
  'STANDARDWOFFPACK': 'Office 365 E2',
  'ENTERPRISEWITHSCAL': 'Office 365 Enterprise E4',
  
  // Exchange Online
  'EXCHANGESTANDARD': 'Exchange Online (Plan 1)',
  'EXCHANGEENTERPRISE': 'Exchange Online (Plan 2)',
  'EXCHANGEARCHIVE_ADDON': 'Exchange Online Archiving',
  'EXCHANGEONLINE': 'Exchange Online',
  'EXCHANGEENTERPRISE_FACULTY': 'Exchange Online (Plan 2) for Faculty',
  'EXCHANGEENTERPRISE_STUDENT': 'Exchange Online (Plan 2) for Students',
  
  // SharePoint Online
  'SHAREPOINTSTANDARD': 'SharePoint Online (Plan 1)',
  'SHAREPOINTENTERPRISE': 'SharePoint Online (Plan 2)',
  'SHAREPOINTSTORAGE': 'SharePoint Online Storage',
  'SHAREPOINTWAC': 'Office Online',
  
  // Teams
  'TEAMS1': 'Microsoft Teams (Free)',
  'TEAMS_COMMERCIAL_TRIAL': 'Microsoft Teams (Commercial Trial)',
  'TEAMS_EXPLORATORY': 'Microsoft Teams Exploratory',
  'TEAMS_ESSENTIALS': 'Microsoft Teams Essentials',
  'MCOEV': 'Microsoft 365 Phone System',
  'MCOSTANDARD': 'Microsoft Teams (Plan 1)',
  'MCOPSTN1': 'Microsoft 365 Domestic Calling Plan',
  'MCOPSTN2': 'Microsoft 365 International Calling Plan',
  'MCOPSTN5': 'Microsoft 365 Domestic and International Calling Plan',
  'MCOPSTN6': 'Microsoft 365 Domestic Calling Plan (120 Minutes)',
  'MCOPSTN7': 'Microsoft 365 Domestic Calling Plan (240 Minutes)',
  
  // Azure Active Directory
  'AAD_BASIC': 'Azure Active Directory Basic',
  'AAD_PREMIUM': 'Azure Active Directory Premium P1',
  'AAD_PREMIUM_P2': 'Azure Active Directory Premium P2',
  'AAD_PREMIUM_V2': 'Azure Active Directory Premium P2',
  
  // Dynamics 365
  'DYN365_ENTERPRISE_P1_IW': 'Dynamics 365 Customer Engagement Plan',
  'DYN365_ENTERPRISE_PLAN1': 'Dynamics 365 Sales Enterprise',
  'DYN365_ENTERPRISE_SALES_CUSTOMERSERVICE': 'Dynamics 365 Sales and Customer Service Enterprise',
  'DYN365_ENTERPRISE_SALES': 'Dynamics 365 Sales Enterprise',
  'DYN365_ENTERPRISE_CUSTOMER_SERVICE': 'Dynamics 365 Customer Service Enterprise',
  'DYN365_ENTERPRISE_TEAM_MEMBERS': 'Dynamics 365 Team Members',
  'DYN365_ENTERPRISE_TALENT_ATTRACT': 'Dynamics 365 Talent: Attract',
  'DYN365_ENTERPRISE_TALENT_ONBOARD': 'Dynamics 365 Talent: Onboard',
  'DYN365_ENTERPRISE_TALENT': 'Dynamics 365 Talent',
  'DYN365_FINANCIALS_BUSINESS_SKU': 'Dynamics 365 Business Central',
  'DYN365_FINANCIALS_TEAM_MEMBERS': 'Dynamics 365 Business Central Team Members',
  'DYN365_SALES_INSIGHTS': 'Dynamics 365 Sales Insights',
  'DYN365_AI_SERVICE_INSIGHTS': 'Dynamics 365 AI for Customer Service',
  'Dynamics_365_Customer_Service_Enterprise_viral_trial': 'Dynamics 365 Customer Service Enterprise (Trial)',
  'Dynamics_365_Sales_Premium_Viral_Trial': 'Dynamics 365 Sales Premium (Trial)',
  
  // Power Platform
  'POWER_BI_PRO': 'Power BI Pro',
  'POWER_BI_PREMIUM_PER_USER': 'Power BI Premium Per User',
  'POWER_BI_PREMIUM_PER_CAPACITY': 'Power BI Premium Per Capacity',
  'POWER_BI_STANDARD': 'Power BI Standard',
  'POWERAPPS_PER_USER': 'Power Apps Per User',
  'POWERAPPS_PER_APP': 'Power Apps Per App',
  'POWERAUTOMATE_PER_USER': 'Power Automate Per User',
  'POWERAUTOMATE_PER_FLOW': 'Power Automate Per Flow',
  'POWER_VIRTUAL_AGENTS': 'Power Virtual Agents',
  'FLOW_FREE': 'Power Automate Free',
  'POWERAPPS_VIRAL': 'Power Apps (Trial)',
  
  // Windows 365
  'WINDOWS_365_BUSINESS': 'Windows 365 Business',
  'WINDOWS_365_ENTERPRISE': 'Windows 365 Enterprise',
  
  // Intune
  'INTUNE_A': 'Microsoft Intune',
  'INTUNE_SMBIZ': 'Microsoft Intune for Small Business',
  
  // Security & Compliance
  'IDENTITY_THREAT_PROTECTION': 'Microsoft Defender for Identity',
  'IDENTITY_THREAT_PROTECTION_FOR_EMS_E5': 'Microsoft Defender for Identity for EMS E5',
  'M365_SECURITY_COMPLIANCE': 'Microsoft 365 Security & Compliance',
  'M365_ADVANCED_AUDITING': 'Microsoft 365 Advanced Auditing',
  'M365_ADVANCED_COMPLIANCE': 'Microsoft 365 Advanced Compliance',
  'M365_ADVANCED_THREAT_PROTECTION': 'Microsoft 365 Advanced Threat Protection',
  'M365_ADVANCED_SECURITY': 'Microsoft 365 Advanced Security',
  'M365_ADVANCED_INSIGHTS': 'Microsoft 365 Advanced Analytics',
  
  // Visio
  'VISIOONLINE_PLAN1': 'Visio Online Plan 1',
  'VISIOONLINE_PLAN2': 'Visio Online Plan 2',
  'VISIOCLIENT': 'Visio Professional',
  'VISIO_PLAN1': 'Visio Plan 1',
  'VISIO_PLAN2': 'Visio Plan 2',
  
  // Project
  'PROJECTONLINE_PLAN_1': 'Project Online Essentials',
  'PROJECTONLINE_PLAN_2': 'Project Online Professional',
  'PROJECTONLINE_PLAN_3': 'Project Online Premium',
  'PROJECT_CLIENT_SUBSCRIPTION': 'Project Professional',
  'PROJECT_P1': 'Project Plan 1',
  'PROJECT_PLAN1': 'Project Plan 1',
  'PROJECT_PLAN3': 'Project Plan 3',
  'PROJECT_PLAN3_DEPT': 'Project Plan 3 for Department',
  'PROJECT_PLAN5': 'Project Plan 5',
  
  // Yammer
  'YAMMER_ENTERPRISE': 'Yammer Enterprise',
  'YAMMER_MIDSIZE': 'Yammer',
  
  // Stream
  'STREAM': 'Microsoft Stream',
  'STREAM_P2': 'Microsoft Stream (Plan 2)',
  
  // Viva
  'VIVA_LEARNING_SEEDED': 'Viva Learning',
  'VIVA_LEARNING': 'Viva Learning',
  'VIVA_INSIGHTS': 'Viva Insights',
  'VIVA_TOPICS': 'Viva Topics',
  'VIVA_CONNECT': 'Viva Connections',
  'VIVA_ENGAGE_CORE': 'Viva Engage Core',
  'VIVA_ENGAGE_ENTERPRISE': 'Viva Engage Enterprise',
  
  // Additional Common SKUs
  'CPC_E_8C_32GB_512GB': 'Windows 365 Enterprise 8vCPU/32GB/512GB',
  'CCIBOTS_PRIVPREV_VIRAL': 'Microsoft Copilot (Trial)',
  'Microsoft_365_Business_Premium_(no Teams)': 'Microsoft 365 Business Premium (without Teams)',
  
  // Defender
  'DEFENDER_ENDPOINT_P1': 'Microsoft Defender for Endpoint P1',
  'DEFENDER_ENDPOINT_P2': 'Microsoft Defender for Endpoint P2',
  'DEFENDER_OFFICE_365_P1': 'Microsoft Defender for Office 365 (Plan 1)',
  'DEFENDER_OFFICE_365_P2': 'Microsoft Defender for Office 365 (Plan 2)',
  'DEFENDER_IDENTITY': 'Microsoft Defender for Identity',
  'DEFENDER_CLOUD_APPS': 'Microsoft Defender for Cloud Apps',
  
  // Information Protection
  'INFORMATION_PROTECTION_COMPLIANCE': 'Microsoft Information Protection and Compliance',
  'MIP_S_CLP1': 'Microsoft Information Protection for Office 365 - Standard',
  'MIP_S_CLP2': 'Microsoft Information Protection for Office 365 - Premium',
  
  // Compliance
  'COMPLIANCE_MANAGER': 'Microsoft Compliance Manager',
  'ADALLOM_S_STANDALONE': 'Microsoft Cloud App Security',
  
  // Additional Enterprise SKUs
  'EMS': 'Enterprise Mobility + Security E3',
  'EMSPREMIUM': 'Enterprise Mobility + Security E5',
  'RIGHTSMANAGEMENT': 'Azure Rights Management',
  'RIGHTSMANAGEMENT_ADHOC': 'Azure Rights Management Ad-hoc',
  
  // Education SKUs
  'STANDARDWOFFPACK_IW_FACULTY': 'Office 365 Education for Faculty',
  'STANDARDWOFFPACK_IW_STUDENT': 'Office 365 Education for Students',
  'STANDARDWOFFPACK_FACULTY': 'Office 365 Education Plus for Faculty',
  'STANDARDWOFFPACK_STUDENT': 'Office 365 Education Plus for Students',
  'STANDARDPACK_FACULTY': 'Office 365 Education E1 for Faculty',
  'STANDARDPACK_STUDENT': 'Office 365 Education E1 for Students',
  'ENTERPRISEPACK_FACULTY': 'Office 365 Education E3 for Faculty',
  'ENTERPRISEPACK_STUDENT': 'Office 365 Education E3 for Students',
  'ENTERPRISEPREMIUM_FACULTY': 'Office 365 Education E5 for Faculty',
  'ENTERPRISEPREMIUM_STUDENT': 'Office 365 Education E5 for Students',
  
  // Government SKUs
  'ENTERPRISEPACK_GOV': 'Microsoft 365 E3 for Government',
  'ENTERPRISEPREMIUM_GOV': 'Microsoft 365 E5 for Government',
  'STANDARDPACK_GOV': 'Office 365 E1 for Government',
  'STANDARDWOFFPACK_GOV': 'Office 365 E2 for Government',
  
  // Nonprofit SKUs
  'STANDARDPACK_NOPSTNCONF': 'Office 365 E1 (Nonprofit)',
  'STANDARDWOFFPACK_NOPSTNCONF': 'Office 365 E2 (Nonprofit)',
  'ENTERPRISEPACK_NOPSTNCONF': 'Office 365 E3 (Nonprofit)',
  'ENTERPRISEPREMIUM_NOPSTNCONF': 'Office 365 E5 (Nonprofit)',
}

/**
 * Loads SKU mappings from database into cache
 */
async function loadSkuMappingsFromDb(): Promise<Map<string, string>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sku_product_mappings')
      .select('sku_part_number, product_name')
      .eq('is_active', true)

    if (error) {
      console.warn('Error loading SKU mappings from database:', error)
      return new Map()
    }

    const mapping = new Map<string, string>()
    data?.forEach((row) => {
      if (row.sku_part_number && row.product_name) {
        mapping.set(row.sku_part_number.toUpperCase(), row.product_name)
      }
    })

    return mapping
  } catch (error) {
    console.warn('Error loading SKU mappings from database:', error)
    return new Map()
  }
}

/**
 * Gets the product display name for a given SKU part number
 * Checks database first (with caching), then falls back to code mapping
 * @param skuPartNumber - The SKU part number to look up
 * @returns The product display name, or a formatted version if not found
 */
export async function getProductNameFromSku(
  skuPartNumber: string | null | undefined
): Promise<string> {
  if (!skuPartNumber) {
    return 'Unknown License'
  }

  // Refresh cache if needed
  const now = Date.now()
  if (!skuMappingCache || now - cacheTimestamp > CACHE_TTL) {
    skuMappingCache = await loadSkuMappingsFromDb()
    cacheTimestamp = now
  }

  const upperSku = skuPartNumber.toUpperCase()

  // Try database mapping first (from cache)
  if (skuMappingCache.has(upperSku)) {
    return skuMappingCache.get(upperSku)!
  }

  // Fall back to code mapping
  if (SKU_PRODUCT_MAPPING[upperSku]) {
    return SKU_PRODUCT_MAPPING[upperSku]
  }
  if (SKU_PRODUCT_MAPPING[skuPartNumber]) {
    return SKU_PRODUCT_MAPPING[skuPartNumber]
  }

  // Try normalized match
  const normalizedSku = upperSku.replace(/[_-]/g, '')
  for (const [key, value] of Object.entries(SKU_PRODUCT_MAPPING)) {
    const normalizedKey = key.toUpperCase().replace(/[_-]/g, '')
    if (normalizedKey === normalizedSku) {
      return value
    }
  }

  // Final fallback: format the SKU
  return formatSkuAsProductName(skuPartNumber)
}

/**
 * Synchronous version that only uses code mapping (for edge cases where async isn't possible)
 * @param skuPartNumber - The SKU part number to look up
 * @returns The product display name, or a formatted version if not found
 */
export function getProductNameFromSkuSync(skuPartNumber: string | null | undefined): string {
  if (!skuPartNumber) {
    return 'Unknown License'
  }
  
  // Try exact match first
  if (SKU_PRODUCT_MAPPING[skuPartNumber]) {
    return SKU_PRODUCT_MAPPING[skuPartNumber]
  }
  
  // Try case-insensitive match
  const upperSku = skuPartNumber.toUpperCase()
  if (SKU_PRODUCT_MAPPING[upperSku]) {
    return SKU_PRODUCT_MAPPING[upperSku]
  }
  
  // Try normalized match
  const normalizedSku = upperSku.replace(/[_-]/g, '')
  for (const [key, value] of Object.entries(SKU_PRODUCT_MAPPING)) {
    const normalizedKey = key.toUpperCase().replace(/[_-]/g, '')
    if (normalizedKey === normalizedSku) {
      return value
    }
  }
  
  // Final fallback: format the SKU
  return formatSkuAsProductName(skuPartNumber)
}

/**
 * Formats a SKU part number into a more readable product name
 * This is used as a fallback when no mapping is found
 * @param skuPartNumber - The SKU part number to format
 * @returns A formatted product name
 */
function formatSkuAsProductName(skuPartNumber: string): string {
  // Replace underscores and hyphens with spaces
  let formatted = skuPartNumber.replace(/[_-]/g, ' ')
  
  // Capitalize first letter of each word
  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return formatted
}

/**
 * Checks if a SKU part number has a known mapping
 * @param skuPartNumber - The SKU part number to check
 * @returns True if a mapping exists, false otherwise
 */
export function hasSkuMapping(skuPartNumber: string | null | undefined): boolean {
  if (!skuPartNumber) {
    return false
  }
  
  const upperSku = skuPartNumber.toUpperCase()
  return SKU_PRODUCT_MAPPING[upperSku] !== undefined || 
         SKU_PRODUCT_MAPPING[skuPartNumber] !== undefined
}

/**
 * Refreshes the SKU mapping cache from the database
 * Useful after bulk updates to mappings
 */
export async function refreshSkuMappingCache(): Promise<void> {
  skuMappingCache = await loadSkuMappingsFromDb()
  cacheTimestamp = Date.now()
}

/**
 * Gets all available SKU mappings (code-based only)
 * @returns An object with all SKU to product name mappings
 */
export function getAllSkuMappings(): Record<string, string> {
  return { ...SKU_PRODUCT_MAPPING }
}
