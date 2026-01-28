$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$email = "automation_tester_" + (Get-Random) + "@example.com"
$password = "password123"

function Invoke-Api {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [string]$Title = ""
    )

    Write-Host "`n[$Title] $Method $Path" -ForegroundColor Cyan
    try {
        $params = @{
            Uri     = "$baseUrl$Path"
            Method  = $Method
            Headers = $Headers
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }

        $response = Invoke-RestMethod @params
        Write-Host "  SUCCESS" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
             $stream = $_.Exception.Response.GetResponseStream()
             $reader = New-Object System.IO.StreamReader($stream)
             Write-Host "  Response: $($reader.ReadToEnd())" -ForegroundColor Red
        }
        return $null
    }
}

# 1. Register & Login
$user = Invoke-Api -Method POST -Path "/auth/register" -Body @{ name="Auto Tester"; email=$email; password=$password } -Title "Registering User"
$login = Invoke-Api -Method POST -Path "/auth/login" -Body @{ email=$email; password=$password } -Title "Logging In"
$token = $login.access_token
$headers = @{ Authorization = "Bearer $token" }
$userId = $user.id

# 2. Create Automation Rule
# Rule: If TASK is CREATED (TASK_CREATED), Log it (or ideally send email, but we check execution via logs/logic)
# We will create a rule that triggers on 'TASK_CREATED'
$rule = Invoke-Api -Method POST -Path "/automation/rules" -Headers $headers -Body @{
    trigger = "TASK_CREATED"
    conditions = @(
        @{ field = "metadata.title"; op = "contains"; value = "Urgent" }
    )
    actions = @("SEND_EMAIL")
} -Title "Creating Automation Rule (Trigger: TASK_CREATED, Condition: Title contains 'Urgent')"

# 3. Create Project
$project = Invoke-Api -Method POST -Path "/projects" -Headers $headers -Body @{ name="Automation Project" } -Title "Creating Project"

# 4. Trigger Event: Create a Task with "Urgent" in title
$task = Invoke-Api -Method POST -Path "/tasks" -Headers $headers -Body @{
    title = "Urgent Task 1"
    description = "This should trigger automation"
    project_id = $project.id
    priority = "HIGH"
} -Title "Creating Task (Should Trigger Automation)"

# 5. Verify Event was created (via Analytics or Activity Log)
# We can check Analytics DAU or execution count
Start-Sleep -Seconds 2 # Wait for async processing

$analytics = Invoke-Api -Method GET -Path "/analytics/dau" -Headers $headers -Title "Checking Analytics DAU"
Write-Host "  DAU Data: $($analytics | ConvertTo-Json -Depth 5)" -ForegroundColor Yellow

# Verify 'Event' collection has entries? We don't have direct API to list all raw events, but DAU relies on it.
if ($analytics.count -gt 0) {
    Write-Host "  VERIFIED: Analytics returned data, meaning Events are being stored." -ForegroundColor Green
} else {
    Write-Host "  WARNING: No DAU data found. Events might not be storing." -ForegroundColor Yellow
}

$executions = Invoke-Api -Method GET -Path "/analytics/automation/executions" -Headers $headers -Title "Checking Automation Executions"
Write-Host "  Automation Executions: $($executions | ConvertTo-Json)" -ForegroundColor Yellow

Write-Host "`nTest Complete. If 'Automation Executions' count > 0, the rule likely fired." -ForegroundColor Green
