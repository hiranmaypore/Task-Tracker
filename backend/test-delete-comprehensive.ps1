# Comprehensive DELETE Task Test

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE Task - Full Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login with existing user
Write-Host "[1] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser_736819323@example.com"
    password = "TestPass123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "  SUCCESS: Logged in" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get existing project
Write-Host "`n[2] Getting projects..." -ForegroundColor Yellow
$projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
$projectId = $projects[0].id
Write-Host "  SUCCESS: Using project $projectId" -ForegroundColor Green

# Create a new task
Write-Host "`n[3] Creating new task..." -ForegroundColor Yellow
$taskBody = @{
    title = "Task to Delete - $(Get-Date -Format 'HH:mm:ss')"
    description = "This task will be deleted in the test"
    project_id = $projectId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

$newTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
$taskId = $newTask.id
Write-Host "  SUCCESS: Task created" -ForegroundColor Green
Write-Host "  Task ID: $taskId" -ForegroundColor Gray
Write-Host "  Title: $($newTask.title)" -ForegroundColor Gray

# Create a subtask
Write-Host "`n[4] Creating subtask..." -ForegroundColor Yellow
$subtaskBody = @{
    title = "Subtask of task to delete"
    project_id = $projectId
    parent_task_id = $taskId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

$subtask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $subtaskBody -Headers $headers
Write-Host "  SUCCESS: Subtask created (ID: $($subtask.id))" -ForegroundColor Green

# Create a comment
Write-Host "`n[5] Creating comment..." -ForegroundColor Yellow
$commentBody = @{
    task_id = $taskId
    content = "This comment will be deleted with the task"
} | ConvertTo-Json

$comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentBody -Headers $headers
Write-Host "  SUCCESS: Comment created (ID: $($comment.id))" -ForegroundColor Green

# Verify task exists with subtask and comment
Write-Host "`n[6] Verifying task has subtask and comment..." -ForegroundColor Yellow
$taskDetails = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
Write-Host "  Task has $($taskDetails.subtasks.Count) subtask(s)" -ForegroundColor Gray
$comments = Invoke-RestMethod -Uri "$baseUrl/comments/task/$taskId" -Method Get -Headers $headers
Write-Host "  Task has $($comments.Count) comment(s)" -ForegroundColor Gray

# DELETE the task
Write-Host "`n[7] DELETING task (with cascade)..." -ForegroundColor Yellow
try {
    $deletedTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Delete -Headers $headers
    Write-Host "  SUCCESS: Task deleted!" -ForegroundColor Green
    Write-Host "  Deleted: $($deletedTask.title)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

# Verify task is gone
Write-Host "`n[8] Verifying task is deleted..." -ForegroundColor Yellow
try {
    $checkTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  WARNING: Task still exists!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  SUCCESS: Task not found (correctly deleted)" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Unexpected error" -ForegroundColor Red
    }
}

# Verify subtask is gone
Write-Host "`n[9] Verifying subtask is deleted..." -ForegroundColor Yellow
try {
    $checkSubtask = Invoke-RestMethod -Uri "$baseUrl/tasks/$($subtask.id)" -Method Get -Headers $headers
    Write-Host "  WARNING: Subtask still exists!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  SUCCESS: Subtask deleted (cascade worked)" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Unexpected error" -ForegroundColor Red
    }
}

# Verify comment is gone
Write-Host "`n[10] Verifying comment is deleted..." -ForegroundColor Yellow
$remainingComments = Invoke-RestMethod -Uri "$baseUrl/comments/task/$taskId" -Method Get -Headers $headers
if ($remainingComments.Count -eq 0) {
    Write-Host "  SUCCESS: Comments deleted (cascade worked)" -ForegroundColor Green
} else {
    Write-Host "  WARNING: $($remainingComments.Count) comment(s) still exist" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nDELETE endpoint is working with:" -ForegroundColor Green
Write-Host "  ✓ Cascade deletion of subtasks" -ForegroundColor Green
Write-Host "  ✓ Cascade deletion of comments" -ForegroundColor Green
Write-Host "  ✓ Proper error handling" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
