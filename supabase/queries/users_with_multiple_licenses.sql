-- ============================================
-- ALL USERS WITH THEIR LICENSE ASSIGNMENTS
-- ============================================

-- Query 1: All users with their licenses (detailed view)
-- Shows every user and every license they have, including users with single licenses
SELECT 
  u.id,
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department,
  COUNT(ul.id) as license_count,
  STRING_AGG(l.display_name, ', ' ORDER BY l.display_name) as license_names,
  STRING_AGG(l.sku_part_number, ', ' ORDER BY l.sku_part_number) as sku_part_numbers,
  MAX(ul.last_synced_at) as licenses_last_synced_at
FROM users u
INNER JOIN user_licenses ul ON u.id = ul.user_id
INNER JOIN licenses l ON ul.license_id = l.id
GROUP BY u.id, u.display_name, u.email, u.user_principal_name, u.job_title, u.department
ORDER BY license_count DESC, u.display_name;

-- Query 2: All users with their licenses (expanded view - one row per license)
-- Shows each license assignment as a separate row
SELECT 
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department,
  l.display_name as license_name,
  l.sku_part_number,
  l.sku_id,
  ul.assigned_at,
  ul.last_synced_at
FROM user_licenses ul
INNER JOIN users u ON ul.user_id = u.id
INNER JOIN licenses l ON ul.license_id = l.id
ORDER BY u.display_name, l.display_name;

-- Query 3: Users grouped by license count (summary)
SELECT 
  license_count,
  COUNT(*) as user_count
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

-- ============================================
-- USERS WITH MULTIPLE LICENSES ONLY
-- ============================================

-- Query 4: Users with multiple licenses (using the view)
SELECT * FROM users_with_multiple_licenses;

-- Query 5: Users with multiple licenses (detailed query)
SELECT 
  u.id,
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department,
  COUNT(ul.id) as license_count,
  STRING_AGG(l.display_name, ', ' ORDER BY l.display_name) as license_names,
  STRING_AGG(l.sku_part_number, ', ' ORDER BY l.sku_part_number) as sku_part_numbers,
  MAX(ul.last_synced_at) as licenses_last_synced_at
FROM users u
INNER JOIN user_licenses ul ON u.id = ul.user_id
INNER JOIN licenses l ON ul.license_id = l.id
GROUP BY u.id, u.display_name, u.email, u.user_principal_name, u.job_title, u.department
HAVING COUNT(ul.id) > 1
ORDER BY license_count DESC, u.display_name;

-- ============================================
-- USERS WITHOUT LICENSES
-- ============================================

-- Query 6: Users who have no licenses assigned
SELECT 
  u.id,
  u.display_name,
  u.email,
  u.user_principal_name,
  u.job_title,
  u.department
FROM users u
LEFT JOIN user_licenses ul ON u.id = ul.user_id
WHERE ul.id IS NULL
ORDER BY u.display_name;
