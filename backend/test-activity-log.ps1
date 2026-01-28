# Test Activity Logging

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Activity Logging Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ==================== SETUP ====================

Write-Host "[SETUP] Creating test user..." -ForegroundColor Yellow
$userEmail = "log_tester_$(Get-Random)@example.com"
$userBody = @{
    name = "Log Tester"
    email = $userEmail
    password = "TestPass123"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $userBody -ContentType "application/json"
Write-Host "  User created: $userEmail" -ForegroundColor Green

Write-Host "`n[SETUP] Logging in..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{email=$userEmail;password="TestPass123"} | ConvertTo-Json) -ContentType "application/json"
$token = $login.access_token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
Write-Host "  User logged in" -ForegroundColor Green

# ==================== ACTION PHASE ====================

Write-Host "`n[ACTION] Performing activities..." -ForegroundColor Yellow

# 1. Create Project
Write-Host "  1. Creating Project..."
$projectBody = @{ name = "Activity Log Project" } | ConvertTo-Json
$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers
$projectId = $project.id
Write-Host "     Done. ID: $projectId" -ForegroundColor Gray

# 2. Update Project
Write-Host "  2. Updating Project..."
$updateProjectBody = @{ name = "Updated Log Project" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Patch -Body $updateProjectBody -Headers $headers | Out-Null
Write-Host "     Done." -ForegroundColor Gray

# 3. Create Task
Write-Host "  3. Creating Task..."
$taskBody = @{
    title = "Log Task"
    project_id = $projectId
    status = "TODO"
    priority = "HIGH"
} | ConvertTo-Json
$task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
$taskId = $task.id
Write-Host "     Done. ID: $taskId" -ForegroundColor Gray

# 4. Update Task Status
Write-Host "  4. Updating Task Status..."
$updateTaskBody = @{ status = "IN_PROGRESS" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Patch -Body $updateTaskBody -Headers $headers | Out-Null
Write-Host "     Done." -ForegroundColor Gray

# 5. Add Comment
Write-Host "  5. Adding Comment..."
$commentBody = @{
    task_id = $taskId
    content = "This is a loggable comment"
} | ConvertTo-Json
$comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentBody -Headers $headers
$commentId = $comment.id
Write-Host "     Done. ID: $commentId" -ForegroundColor Gray

# 6. Delete Comment
Write-Host "  6. Deleting Comment..."
Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Delete -Headers $headers | Out-Null
Write-Host "     Done." -ForegroundColor Gray

# ==================== VERIFICATION PHASE ====================

Write-Host "`n[VERIFY] Checking Activity Logs..." -ForegroundColor Yellow

# Get My Activities
try {
    $activities = Invoke-RestMethod -Uri "$baseUrl/activity-log/me" -Method Get -Headers $headers
    
    Write-Host "`nTotal Activities Found: $($activities.Count)" -ForegroundColor Cyan
    
    foreach ($log in $activities) {
        $action = $log.action
        $type = $log.entity_type
        $time = $log.timestamp
        
        Write-Host "  [$time] $action on $type ($($log.entity_id))" -ForegroundColor Green
    }

    # Validation Checks
    $hasProjectCreate = $activities | Where-Object { $_.action -like "CREATED*" -and $_.entity_type -eq "PROJECT" }
    $hasProjectUpdate = $activities | Where-Object { $_.action -like "UPDATED*" -and $_.entity_type -eq "PROJECT" }
    $hasTaskCreate = $activities | Where-Object { $_.action -like "CREATED*" -and $_.entity_type -eq "TASK" }
    $hasStatusChange = $activities | Where-Object { $_.action -like "STATUS_CHANGED*" -and $_.entity_type -eq "TASK" }
    $hasCommentAdd = $activities | Where-Object { $_.action -like "COMMENTED*" -and $_.entity_type -eq "COMMENT" }
    
    Write-Host "`nTest Results:" -ForegroundColor White
    if ($hasProjectCreate) { Write-Host "  ✅ Project Creation Logged" -ForegroundColor Green } else { Write-Host "  ❌ Project Creation Missing" -ForegroundColor Red }
    if ($hasProjectUpdate) { Write-Host "  ✅ Project Update Logged" -ForegroundColor Green } else { Write-Host "  ❌ Project Update Missing" -ForegroundColor Red }
    if ($hasTaskCreate) { Write-Host "  ✅ Task Creation Logged" -ForegroundColor Green } else { Write-Host "  ❌ Task Creation Missing" -ForegroundColor Red }
    if ($hasStatusChange) { Write-Host "  ✅ Task Status Change Logged" -ForegroundColor Green } else { Write-Host "  ❌ Task Status Change Missing" -ForegroundColor Red }
    if ($hasCommentAdd) { Write-Host "  ✅ Comment Addition Logged" -ForegroundColor Green } else { Write-Host "  ❌ Comment Addition Missing" -ForegroundColor Red }

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
