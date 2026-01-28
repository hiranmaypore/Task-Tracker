$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE SYSTEM TEST - ALL FEATURES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$email = "test_user_" + (Get-Random) + "@example.com"
$password = "SecurePass123!"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [bool]$ExpectSuccess = $true
    )

    Write-Host "`n[$Name]" -ForegroundColor Yellow
    Write-Host "  $Method $Path" -ForegroundColor Gray
    
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
        
        if ($ExpectSuccess) {
            Write-Host "  SUCCESS" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Response = $response }
            return $response
        } else {
            Write-Host "  UNEXPECTED SUCCESS" -ForegroundColor Yellow
            $script:testResults += @{ Name = $Name; Status = "WARN"; Response = $response }
            return $response
        }
    } catch {
        if (-not $ExpectSuccess) {
            Write-Host "  EXPECTED FAILURE" -ForegroundColor Green
            $script:testResults += @{ Name = $Name; Status = "PASS"; Error = $_.Exception.Message }
            return $null
        } else {
            Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $script:testResults += @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
            return $null
        }
    }
}

# ============================================
# PHASE 1: AUTHENTICATION & USER MANAGEMENT
# ============================================
Write-Host "`n=== PHASE 1: AUTHENTICATION ===" -ForegroundColor Magenta

$user = Test-Endpoint -Name "Register User" -Method POST -Path "/auth/register" `
    -Body @{ name="Test User"; email=$email; password=$password }

$login = Test-Endpoint -Name "Login" -Method POST -Path "/auth/login" `
    -Body @{ email=$email; password=$password }

if (-not $login) {
    Write-Host "`nLOGIN FAILED - Cannot continue tests" -ForegroundColor Red
    exit 1
}

$token = $login.access_token
$userId = $user.id
$headers = @{ Authorization = "Bearer $token" }

Write-Host "`n  User ID: $userId" -ForegroundColor Cyan
Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan

# ============================================
# PHASE 2: PROJECT MANAGEMENT
# ============================================
Write-Host "`n=== PHASE 2: PROJECT MANAGEMENT ===" -ForegroundColor Magenta

$project1 = Test-Endpoint -Name "Create Project 1" -Method POST -Path "/projects" `
    -Headers $headers -Body @{ name="Analytics Dashboard Project" }

$project2 = Test-Endpoint -Name "Create Project 2" -Method POST -Path "/projects" `
    -Headers $headers -Body @{ name="Automation Testing Project" }

Test-Endpoint -Name "Get All Projects" -Method GET -Path "/projects" -Headers $headers

Test-Endpoint -Name "Get Project Details" -Method GET -Path "/projects/$($project1.id)" -Headers $headers

# ============================================
# PHASE 3: TASK MANAGEMENT
# ============================================
Write-Host "`n=== PHASE 3: TASK MANAGEMENT ===" -ForegroundColor Magenta

$task1 = Test-Endpoint -Name "Create HIGH Priority Task" -Method POST -Path "/tasks" `
    -Headers $headers -Body @{
        title = "Urgent: Implement Analytics"
        description = "Build MongoDB aggregation pipelines"
        project_id = $project1.id
        priority = "HIGH"
        status = "TODO"
        due_date = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }

$task2 = Test-Endpoint -Name "Create MEDIUM Priority Task" -Method POST -Path "/tasks" `
    -Headers $headers -Body @{
        title = "Setup Automation Rules"
        description = "Configure event-driven automation"
        project_id = $project2.id
        priority = "MEDIUM"
        status = "IN_PROGRESS"
        due_date = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }

$task3 = Test-Endpoint -Name "Create LOW Priority Task" -Method POST -Path "/tasks" `
    -Headers $headers -Body @{
        title = "Write Documentation"
        description = "Document all features"
        project_id = $project1.id
        priority = "LOW"
        status = "TODO"
    }

Test-Endpoint -Name "Get All Tasks" -Method GET -Path "/tasks" -Headers $headers

Test-Endpoint -Name "Update Task Status" -Method PATCH -Path "/tasks/$($task1.id)" `
    -Headers $headers -Body @{ status = "IN_PROGRESS" }

Test-Endpoint -Name "Get Task by ID" -Method GET -Path "/tasks/$($task1.id)" -Headers $headers

# ============================================
# PHASE 4: COMMENTS
# ============================================
Write-Host "`n=== PHASE 4: COMMENTS ===" -ForegroundColor Magenta

$comment1 = Test-Endpoint -Name "Add Comment to Task" -Method POST -Path "/comments" `
    -Headers $headers -Body @{
        task_id = $task1.id
        content = "Started working on MongoDB aggregation pipelines"
    }

Test-Endpoint -Name "Get Task Comments" -Method GET -Path "/comments/task/$($task1.id)" -Headers $headers

# ============================================
# PHASE 5: ACTIVITY LOG
# ============================================
Write-Host "`n=== PHASE 5: ACTIVITY LOG ===" -ForegroundColor Magenta

Test-Endpoint -Name "Get My Activity Logs" -Method GET -Path "/activity-log/me" -Headers $headers

Test-Endpoint -Name "Get Recent Activities" -Method GET -Path "/activity-log/recent" -Headers $headers

Test-Endpoint -Name "Get Project Activity" -Method GET -Path "/activity-log/project/$($project1.id)" -Headers $headers

# ============================================
# PHASE 6: STATISTICS & ANALYTICS
# ============================================
Write-Host "`n=== PHASE 6: STATISTICS & ANALYTICS ===" -ForegroundColor Magenta

Test-Endpoint -Name "Get Dashboard Statistics" -Method GET -Path "/statistics/dashboard" -Headers $headers

Test-Endpoint -Name "Get Project Statistics" -Method GET -Path "/statistics/project/$($project1.id)" -Headers $headers

# Analytics endpoints (Admin only - expect 403)
Test-Endpoint -Name "Get DAU (Should Fail - Not Admin)" -Method GET -Path "/analytics/dau" `
    -Headers $headers -ExpectSuccess $false

Test-Endpoint -Name "Get Task Completion Rate (Should Fail)" -Method GET -Path "/analytics/tasks/completion" `
    -Headers $headers -ExpectSuccess $false

# ============================================
# PHASE 7: AUTOMATION RULES
# ============================================
Write-Host "`n=== PHASE 7: AUTOMATION RULES ===" -ForegroundColor Magenta

$rule1 = Test-Endpoint -Name "Create Automation Rule (High Priority Alert)" -Method POST -Path "/automation/rules" `
    -Headers $headers -Body @{
        trigger = "TASK_CREATED"
        conditions = @(
            @{ field = "metadata.priority"; op = "="; value = "HIGH" }
        )
        actions = @("SEND_EMAIL")
        enabled = $true
    }

Test-Endpoint -Name "Get All Automation Rules" -Method GET -Path "/automation/rules" -Headers $headers

# Create a task that should trigger automation
$triggerTask = Test-Endpoint -Name "Create Task to Trigger Automation" -Method POST -Path "/tasks" `
    -Headers $headers -Body @{
        title = "Urgent: Critical Bug Fix"
        description = "This should trigger automation rules"
        project_id = $project1.id
        priority = "HIGH"
        status = "TODO"
    }

Start-Sleep -Seconds 2

# ============================================
# PHASE 8: GOOGLE CALENDAR SYNC
# ============================================
Write-Host "`n=== PHASE 8: GOOGLE CALENDAR SYNC ===" -ForegroundColor Magenta

$authUrl = Test-Endpoint -Name "Get Calendar Auth URL" -Method GET -Path "/calendar/auth-url" -Headers $headers

if ($authUrl -and $authUrl.authUrl) {
    Write-Host "`n  Calendar OAuth URL:" -ForegroundColor Cyan
    Write-Host "  $($authUrl.authUrl)" -ForegroundColor Gray
}

$calendarStatus = Test-Endpoint -Name "Get Calendar Sync Status" -Method GET -Path "/calendar/status" -Headers $headers

if ($calendarStatus) {
    Write-Host "`n  Calendar Connected: $($calendarStatus.connected)" -ForegroundColor Cyan
}

# ============================================
# PHASE 9: CLEANUP & DELETION
# ============================================
Write-Host "`n=== PHASE 9: CLEANUP TESTS ===" -ForegroundColor Magenta

if ($rule1) {
    Test-Endpoint -Name "Delete Automation Rule" -Method DELETE -Path "/automation/rules/$($rule1.id)" -Headers $headers
}

Test-Endpoint -Name "Delete Comment" -Method DELETE -Path "/comments/$($comment1.id)" -Headers $headers

Test-Endpoint -Name "Delete Task" -Method DELETE -Path "/tasks/$($task3.id)" -Headers $headers

# ============================================
# TEST SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warned = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$total = $testResults.Count

Write-Host "  Total Tests: $total" -ForegroundColor White
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "  Warnings: $warned" -ForegroundColor Yellow

$successRate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "`n  Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

# Show failed tests
if ($failed -gt 0) {
    Write-Host "`n  Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "    - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FEATURE COVERAGE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "  Authentication & Authorization" -ForegroundColor Green
Write-Host "  Project Management" -ForegroundColor Green
Write-Host "  Task CRUD Operations" -ForegroundColor Green
Write-Host "  Comments System" -ForegroundColor Green
Write-Host "  Activity Logging" -ForegroundColor Green
Write-Host "  Statistics Dashboard" -ForegroundColor Green
Write-Host "  Automation Rules Engine" -ForegroundColor Green
Write-Host "  Google Calendar Integration" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "ALL TESTS PASSED! System is working perfectly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Please review the errors above." -ForegroundColor Yellow
    exit 1
}
