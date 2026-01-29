# Comprehensive DELETE Operations Test Script
# Tests: Delete Task, Delete Subtask, Delete Comment

$baseUrl = "http://localhost:3000"
$testEmail = "deleteall_$(Get-Random)@example.com"
$testPassword = "TestPass123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE Operations Test Suite" -ForegroundColor Cyan
Write-Host "  Testing: Tasks, Subtasks, Comments" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# SETUP: Register and Login
# ============================================
Write-Host "[SETUP 1/3] Registering user..." -ForegroundColor Yellow
$registerBody = @{
    name = "Delete Test User"
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "  ✓ User created" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[SETUP 2/3] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "  ✓ Token received" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# ============================================
# SETUP: Create Project
# ============================================
Write-Host "`n[SETUP 3/3] Creating project..." -ForegroundColor Yellow
$projectBody = @{
    name = "Delete Operations Test Project"
    description = "Testing all delete operations"
} | ConvertTo-Json

try {
    $project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers
    $projectId = $project.id
    Write-Host "  ✓ Project created (ID: $projectId)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Project creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================
# TEST 1: DELETE TASK
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST 1: DELETE TASK" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`n[1.1] Creating task..." -ForegroundColor Yellow
$taskBody = @{
    title = "Task to be deleted"
    description = "This task will be deleted"
    project_id = $projectId
    status = "TODO"
    priority = "MEDIUM"
} | ConvertTo-Json

try {
    $task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
    $taskId = $task.id
    Write-Host "  ✓ Task created (ID: $taskId)" -ForegroundColor Green
    Write-Host "    Title: $($task.title)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Task creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1.2] Verifying task exists..." -ForegroundColor Yellow
try {
    $existingTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  ✓ Task found" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Task not found" -ForegroundColor Red
}

Write-Host "`n[1.3] DELETING task..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Delete -Headers $headers
    Write-Host "  ✓ Task deleted successfully!" -ForegroundColor Green
    Write-Host "    Response: $($deleteResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[1.4] Verifying task is deleted..." -ForegroundColor Yellow
try {
    $deletedTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  ✗ WARNING: Task still exists!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✓ Task not found (correctly deleted)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# TEST 2: DELETE SUBTASK
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST 2: DELETE SUBTASK" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`n[2.1] Creating parent task..." -ForegroundColor Yellow
$parentTaskBody = @{
    title = "Parent Task"
    description = "This is the parent task"
    project_id = $projectId
    status = "IN_PROGRESS"
    priority = "HIGH"
} | ConvertTo-Json

try {
    $parentTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $parentTaskBody -Headers $headers
    $parentTaskId = $parentTask.id
    Write-Host "  ✓ Parent task created (ID: $parentTaskId)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Parent task creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2.2] Creating subtask..." -ForegroundColor Yellow
$subtaskBody = @{
    title = "Subtask to be deleted"
    description = "This is a subtask that will be deleted"
    project_id = $projectId
    parent_task_id = $parentTaskId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

try {
    $subtask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $subtaskBody -Headers $headers
    $subtaskId = $subtask.id
    Write-Host "  ✓ Subtask created (ID: $subtaskId)" -ForegroundColor Green
    Write-Host "    Title: $($subtask.title)" -ForegroundColor Gray
    Write-Host "    Parent ID: $($subtask.parent_task_id)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Subtask creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2.3] Verifying subtask exists..." -ForegroundColor Yellow
try {
    $existingSubtask = Invoke-RestMethod -Uri "$baseUrl/tasks/$subtaskId" -Method Get -Headers $headers
    Write-Host "  ✓ Subtask found" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Subtask not found" -ForegroundColor Red
}

Write-Host "`n[2.4] DELETING subtask..." -ForegroundColor Yellow
try {
    $deleteSubtaskResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$subtaskId" -Method Delete -Headers $headers
    Write-Host "  ✓ Subtask deleted successfully!" -ForegroundColor Green
    Write-Host "    Response: $($deleteSubtaskResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[2.5] Verifying subtask is deleted..." -ForegroundColor Yellow
try {
    $deletedSubtask = Invoke-RestMethod -Uri "$baseUrl/tasks/$subtaskId" -Method Get -Headers $headers
    Write-Host "  ✗ WARNING: Subtask still exists!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✓ Subtask not found (correctly deleted)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n[2.6] Verifying parent task still exists..." -ForegroundColor Yellow
try {
    $parentTaskCheck = Invoke-RestMethod -Uri "$baseUrl/tasks/$parentTaskId" -Method Get -Headers $headers
    Write-Host "  ✓ Parent task still exists (correct behavior)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Parent task was deleted (incorrect!)" -ForegroundColor Red
}

# ============================================
# TEST 3: DELETE COMMENT
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST 3: DELETE COMMENT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`n[3.1] Creating task for comment..." -ForegroundColor Yellow
$commentTaskBody = @{
    title = "Task with comments"
    description = "This task will have comments"
    project_id = $projectId
    status = "TODO"
    priority = "MEDIUM"
} | ConvertTo-Json

try {
    $commentTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $commentTaskBody -Headers $headers
    $commentTaskId = $commentTask.id
    Write-Host "  ✓ Task created (ID: $commentTaskId)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Task creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3.2] Creating comment..." -ForegroundColor Yellow
$commentBody = @{
    task_id = $commentTaskId
    content = "This comment will be deleted"
} | ConvertTo-Json

try {
    $comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentBody -Headers $headers
    $commentId = $comment.id
    Write-Host "  ✓ Comment created (ID: $commentId)" -ForegroundColor Green
    Write-Host "    Content: $($comment.content)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Comment creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3.3] Verifying comment exists..." -ForegroundColor Yellow
try {
    $existingComment = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Get -Headers $headers
    Write-Host "  ✓ Comment found" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Comment not found" -ForegroundColor Red
}

Write-Host "`n[3.4] DELETING comment..." -ForegroundColor Yellow
try {
    $deleteCommentResponse = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Delete -Headers $headers
    Write-Host "  ✓ Comment deleted successfully!" -ForegroundColor Green
    Write-Host "    Response: $($deleteCommentResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[3.5] Verifying comment is deleted..." -ForegroundColor Yellow
try {
    $deletedComment = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Get -Headers $headers
    Write-Host "  ✗ WARNING: Comment still exists!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✓ Comment not found (correctly deleted)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n[3.6] Verifying task still exists..." -ForegroundColor Yellow
try {
    $taskCheck = Invoke-RestMethod -Uri "$baseUrl/tasks/$commentTaskId" -Method Get -Headers $headers
    Write-Host "  ✓ Task still exists (correct behavior)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Task was deleted (incorrect!)" -ForegroundColor Red
}

# ============================================
# TEST 4: DELETE WITH MULTIPLE COMMENTS
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST 4: DELETE TASK WITH COMMENTS" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`n[4.1] Creating task..." -ForegroundColor Yellow
$multiCommentTaskBody = @{
    title = "Task with multiple comments"
    description = "This task will have multiple comments and be deleted"
    project_id = $projectId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

try {
    $multiCommentTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $multiCommentTaskBody -Headers $headers
    $multiCommentTaskId = $multiCommentTask.id
    Write-Host "  ✓ Task created (ID: $multiCommentTaskId)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Task creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n[4.2] Creating multiple comments..." -ForegroundColor Yellow
$commentIds = @()
for ($i = 1; $i -le 3; $i++) {
    $multiCommentBody = @{
        task_id = $multiCommentTaskId
        content = "Comment #$i on task"
    } | ConvertTo-Json
    
    try {
        $multiComment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $multiCommentBody -Headers $headers
        $commentIds += $multiComment.id
        Write-Host "  ✓ Comment #$i created (ID: $($multiComment.id))" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Comment #$i creation failed" -ForegroundColor Red
    }
}

Write-Host "`n[4.3] Deleting task (should cascade delete comments)..." -ForegroundColor Yellow
try {
    $deleteTaskWithComments = Invoke-RestMethod -Uri "$baseUrl/tasks/$multiCommentTaskId" -Method Delete -Headers $headers
    Write-Host "  ✓ Task deleted successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[4.4] Verifying comments are also deleted..." -ForegroundColor Yellow
$allCommentsDeleted = $true
foreach ($cId in $commentIds) {
    try {
        $checkComment = Invoke-RestMethod -Uri "$baseUrl/comments/$cId" -Method Get -Headers $headers
        Write-Host "  ✗ Comment $cId still exists!" -ForegroundColor Red
        $allCommentsDeleted = $false
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "  ✓ Comment $cId deleted (cascade)" -ForegroundColor Green
        }
    }
}

if ($allCommentsDeleted) {
    Write-Host "`n  ✓ All comments cascaded correctly!" -ForegroundColor Green
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE OPERATIONS TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nTested Operations:" -ForegroundColor White
Write-Host "  ✓ DELETE Task" -ForegroundColor Green
Write-Host "  ✓ DELETE Subtask (via task endpoint)" -ForegroundColor Green
Write-Host "  ✓ DELETE Comment" -ForegroundColor Green
Write-Host "  ✓ CASCADE Delete (task with comments)" -ForegroundColor Green
Write-Host "`n========================================`n" -ForegroundColor Cyan
