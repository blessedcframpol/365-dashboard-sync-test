# PowerShell script to invoke the Supabase Edge Function
# Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with your actual values

# Get these from your Supabase dashboard:
# - Project Reference: Found in your project URL (https://app.supabase.com/project/YOUR_PROJECT_REF)
# - Service Role Key: Settings > API > service_role key

$projectRef = "YOUR_PROJECT_REF"  # Replace with your project reference
$serviceRoleKey = "YOUR_SERVICE_ROLE_KEY"  # Replace with your service role key
$syncType = "full"  # Options: full, users, licenses, user-licenses, mailbox, onedrive

$uri = "https://$projectRef.supabase.co/functions/v1/sync-microsoft-graph?type=$syncType"
$headers = @{
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
}

Write-Host "Invoking sync-microsoft-graph Edge Function..." -ForegroundColor Cyan
Write-Host "URL: $uri" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers
    Write-Host "Success!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
