-- ============================================
-- ALL USERS WITH THEIR LICENSE ASSIGNMENTS
-- ============================================
-- This query shows every user and every license they have assigned
-- Includes users with single licenses and multiple licenses

-- OPTION 1: Grouped view (one row per user with all licenses listed)
-- Best for seeing the full picture of each user's license assignments
SELECT 
  u.id,
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department,
  u.account_enabled,
  COUNT(ul.id) as license_count,
  STRING_AGG(l.display_name, ', ' ORDER BY l.display_name) as license_names,
  STRING_AGG(l.sku_part_number, ', ' ORDER BY l.sku_part_number) as sku_part_numbers,
  MAX(ul.last_synced_at) as licenses_last_synced_at
FROM users u
INNER JOIN user_licenses ul ON u.id = ul.user_id
INNER JOIN licenses l ON ul.license_id = l.id
GROUP BY u.id, u.display_name, u.email, u.user_principal_name, u.job_title, u.department, u.account_enabled
ORDER BY license_count DESC, u.display_name;

-- OPTION 2: Expanded view (one row per license assignment)
-- Best for detailed analysis, filtering, or exporting to CSV
SELECT 
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department,
  u.account_enabled,
  l.display_name as license_name,
  l.sku_part_number,
  l.sku_id,
  ul.assigned_at,
  ul.last_synced_at
FROM user_licenses ul
INNER JOIN users u ON ul.user_id = u.id
INNER JOIN licenses l ON ul.license_id = l.id
ORDER BY u.display_name, l.display_name;

-- OPTION 3: Summary statistics
-- Shows distribution of license counts across users
SELECT 
  license_count,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
  SELECT 
    u.id,
    COUNT(ul.id) as license_count
  FROM users u
  INNER JOIN user_licenses ul ON u.id = ul.user_id
  GROUP BY u.id
) as license_counts
GROUP BY license_count
ORDER BY license_count DESC;
