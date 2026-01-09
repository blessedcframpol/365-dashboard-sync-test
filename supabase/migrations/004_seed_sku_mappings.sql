-- Seed script to populate initial SKU product mappings
-- This seeds the table with the mappings from the code-based mapping
-- Run this after creating the table

-- Insert Microsoft 365 Plans
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('ENTERPRISEPACK', 'Microsoft 365 E3', 'code', 'Initial seed from code mapping'),
  ('ENTERPRISEPREMIUM', 'Microsoft 365 E5', 'code', 'Initial seed from code mapping'),
  ('DEVELOPERPACK', 'Microsoft 365 Developer', 'code', 'Initial seed from code mapping'),
  ('M365EDU_A3_FACULTY', 'Microsoft 365 A3 for Faculty', 'code', 'Initial seed from code mapping'),
  ('M365EDU_A3_STUDENT', 'Microsoft 365 A3 for Students', 'code', 'Initial seed from code mapping'),
  ('M365EDU_A5_FACULTY', 'Microsoft 365 A5 for Faculty', 'code', 'Initial seed from code mapping'),
  ('M365EDU_A5_STUDENT', 'Microsoft 365 A5 for Students', 'code', 'Initial seed from code mapping'),
  ('M365_BUSINESS_PREMIUM', 'Microsoft 365 Business Premium', 'code', 'Initial seed from code mapping'),
  ('M365_BUSINESS_STANDARD', 'Microsoft 365 Business Standard', 'code', 'Initial seed from code mapping'),
  ('M365_BUSINESS_BASIC', 'Microsoft 365 Business Basic', 'code', 'Initial seed from code mapping'),
  ('O365_BUSINESS_ESSENTIALS', 'Microsoft 365 Business Essentials', 'code', 'Initial seed from code mapping'),
  ('O365_BUSINESS_PREMIUM', 'Microsoft 365 Business Premium', 'code', 'Initial seed from code mapping'),
  ('O365_BUSINESS', 'Microsoft 365 Business', 'code', 'Initial seed from code mapping'),
  ('SPB', 'Microsoft 365 Business Premium', 'code', 'Initial seed from code mapping'),
  ('SPE_E3', 'Microsoft 365 E3', 'code', 'Initial seed from code mapping'),
  ('SPE_E5', 'Microsoft 365 E5', 'code', 'Initial seed from code mapping'),
  ('SPE_F1', 'Microsoft 365 F1', 'code', 'Initial seed from code mapping'),
  ('SPE_F3', 'Microsoft 365 F3', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Office 365 Plans
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('O365_E1', 'Office 365 E1', 'code', 'Initial seed from code mapping'),
  ('O365_E3', 'Office 365 E3', 'code', 'Initial seed from code mapping'),
  ('O365_E5', 'Office 365 E5', 'code', 'Initial seed from code mapping'),
  ('O365_F1', 'Office 365 F1', 'code', 'Initial seed from code mapping'),
  ('O365_F3', 'Office 365 F3', 'code', 'Initial seed from code mapping'),
  ('STANDARDPACK', 'Office 365 E1', 'code', 'Initial seed from code mapping'),
  ('STANDARDWOFFPACK', 'Office 365 E2', 'code', 'Initial seed from code mapping'),
  ('ENTERPRISEWITHSCAL', 'Office 365 Enterprise E4', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Exchange Online
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('EXCHANGESTANDARD', 'Exchange Online (Plan 1)', 'code', 'Initial seed from code mapping'),
  ('EXCHANGEENTERPRISE', 'Exchange Online (Plan 2)', 'code', 'Initial seed from code mapping'),
  ('EXCHANGEARCHIVE_ADDON', 'Exchange Online Archiving', 'code', 'Initial seed from code mapping'),
  ('EXCHANGEONLINE', 'Exchange Online', 'code', 'Initial seed from code mapping'),
  ('EXCHANGEENTERPRISE_FACULTY', 'Exchange Online (Plan 2) for Faculty', 'code', 'Initial seed from code mapping'),
  ('EXCHANGEENTERPRISE_STUDENT', 'Exchange Online (Plan 2) for Students', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert SharePoint Online
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('SHAREPOINTSTANDARD', 'SharePoint Online (Plan 1)', 'code', 'Initial seed from code mapping'),
  ('SHAREPOINTENTERPRISE', 'SharePoint Online (Plan 2)', 'code', 'Initial seed from code mapping'),
  ('SHAREPOINTSTORAGE', 'SharePoint Online Storage', 'code', 'Initial seed from code mapping'),
  ('SHAREPOINTWAC', 'Office Online', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Teams
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('TEAMS1', 'Microsoft Teams (Free)', 'code', 'Initial seed from code mapping'),
  ('TEAMS_COMMERCIAL_TRIAL', 'Microsoft Teams (Commercial Trial)', 'code', 'Initial seed from code mapping'),
  ('TEAMS_EXPLORATORY', 'Microsoft Teams Exploratory', 'code', 'Initial seed from code mapping'),
  ('TEAMS_ESSENTIALS', 'Microsoft Teams Essentials', 'code', 'Initial seed from code mapping'),
  ('MCOEV', 'Microsoft 365 Phone System', 'code', 'Initial seed from code mapping'),
  ('MCOSTANDARD', 'Microsoft Teams (Plan 1)', 'code', 'Initial seed from code mapping'),
  ('MCOPSTN1', 'Microsoft 365 Domestic Calling Plan', 'code', 'Initial seed from code mapping'),
  ('MCOPSTN2', 'Microsoft 365 International Calling Plan', 'code', 'Initial seed from code mapping'),
  ('MCOPSTN5', 'Microsoft 365 Domestic and International Calling Plan', 'code', 'Initial seed from code mapping'),
  ('MCOPSTN6', 'Microsoft 365 Domestic Calling Plan (120 Minutes)', 'code', 'Initial seed from code mapping'),
  ('MCOPSTN7', 'Microsoft 365 Domestic Calling Plan (240 Minutes)', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Azure Active Directory
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('AAD_BASIC', 'Azure Active Directory Basic', 'code', 'Initial seed from code mapping'),
  ('AAD_PREMIUM', 'Azure Active Directory Premium P1', 'code', 'Initial seed from code mapping'),
  ('AAD_PREMIUM_P2', 'Azure Active Directory Premium P2', 'code', 'Initial seed from code mapping'),
  ('AAD_PREMIUM_V2', 'Azure Active Directory Premium P2', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Dynamics 365
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('DYN365_ENTERPRISE_P1_IW', 'Dynamics 365 Customer Engagement Plan', 'code', 'Initial seed from code mapping'),
  ('DYN365_ENTERPRISE_PLAN1', 'Dynamics 365 Sales Enterprise', 'code', 'Initial seed from code mapping'),
  ('DYN365_ENTERPRISE_SALES_CUSTOMERSERVICE', 'Dynamics 365 Sales and Customer Service Enterprise', 'code', 'Initial seed from code mapping'),
  ('DYN365_ENTERPRISE_SALES', 'Dynamics 365 Sales Enterprise', 'code', 'Initial seed from code mapping'),
  ('DYN365_ENTERPRISE_CUSTOMER_SERVICE', 'Dynamics 365 Customer Service Enterprise', 'code', 'Initial seed from code mapping'),
  ('DYN365_ENTERPRISE_TEAM_MEMBERS', 'Dynamics 365 Team Members', 'code', 'Initial seed from code mapping'),
  ('DYN365_AI_SERVICE_INSIGHTS', 'Dynamics 365 AI for Customer Service', 'code', 'Initial seed from code mapping'),
  ('Dynamics_365_Customer_Service_Enterprise_viral_trial', 'Dynamics 365 Customer Service Enterprise (Trial)', 'code', 'Initial seed from code mapping'),
  ('Dynamics_365_Sales_Premium_Viral_Trial', 'Dynamics 365 Sales Premium (Trial)', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert Power Platform
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('POWER_BI_PRO', 'Power BI Pro', 'code', 'Initial seed from code mapping'),
  ('POWER_BI_PREMIUM_PER_USER', 'Power BI Premium Per User', 'code', 'Initial seed from code mapping'),
  ('POWER_BI_PREMIUM_PER_CAPACITY', 'Power BI Premium Per Capacity', 'code', 'Initial seed from code mapping'),
  ('POWERAPPS_PER_USER', 'Power Apps Per User', 'code', 'Initial seed from code mapping'),
  ('POWERAPPS_PER_APP', 'Power Apps Per App', 'code', 'Initial seed from code mapping'),
  ('POWERAUTOMATE_PER_USER', 'Power Automate Per User', 'code', 'Initial seed from code mapping'),
  ('POWERAUTOMATE_PER_FLOW', 'Power Automate Per Flow', 'code', 'Initial seed from code mapping'),
  ('FLOW_FREE', 'Power Automate Free', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;

-- Insert additional common SKUs
INSERT INTO sku_product_mappings (sku_part_number, product_name, source, notes)
VALUES
  ('CPC_E_8C_32GB_512GB', 'Windows 365 Enterprise 8vCPU/32GB/512GB', 'code', 'Initial seed from code mapping'),
  ('CCIBOTS_PRIVPREV_VIRAL', 'Microsoft Copilot (Trial)', 'code', 'Initial seed from code mapping'),
  ('Microsoft_365_Business_Premium_(no Teams)', 'Microsoft 365 Business Premium (without Teams)', 'code', 'Initial seed from code mapping')
ON CONFLICT (sku_part_number) DO NOTHING;
