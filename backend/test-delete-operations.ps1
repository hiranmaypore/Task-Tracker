# Test DELETE Operations: Tasks, Subtasks, Comments

$baseUrl = "http://localhost:3000"
$testEmail = "deleteops_$(Get-Random)@example.com"
$testPassword = "TestPass123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE Operations Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# SETUP: Register and Login
Write-Host "[SETUP 1/3] Registering user..." -ForegroundColor Yellow
$registerBody = @{
    name = "Delete Test User"
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
Write-Host "  SUCCESS: User created" -ForegroundColor Green

Write-Host "`n[SETUP 2/3] Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "  SUCCESS: Token received" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# SETUP: Create Project
Write-Host "`n[SETUP 3/3] Creating project..." -ForegroundColor Yellow
$projectBody = @{
    name = "Delete Operations Test Project"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers
$projectId = $project.id
Write-Host "  SUCCESS: Project created (ID: $projectId)" -ForegroundColor Green

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

$task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
$taskId = $task.id
Write-Host "  SUCCESS: Task created (ID: $taskId)" -ForegroundColor Green

Write-Host "`n[1.2] Verifying task exists..." -ForegroundColor Yellow
$existingTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
Write-Host "  SUCCESS: Task found - $($existingTask.title)" -ForegroundColor Green

Write-Host "`n[1.3] DELETING task..." -ForegroundColor Yellow
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Delete -Headers $headers
Write-Host "  SUCCESS: Task deleted!" -ForegroundColor Green

Write-Host "`n[1.4] Verifying task is deleted..." -ForegroundColor Yellow
try {
    $deletedTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  WARNING: Task still exists (should have been deleted)" -ForegroundColor Red
}
catch {
    Write-Host "  SUCCESS: Task not found (correctly deleted)" -ForegroundColor Green
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

$parentTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $parentTaskBody -Headers $headers
$parentTaskId = $parentTask.id
Write-Host "  SUCCESS: Parent task created (ID: $parentTaskId)" -ForegroundColor Green

Write-Host "`n[2.2] Creating subtask..." -ForegroundColor Yellow
$subtaskBody = @{
    title = "Subtask to be deleted"
    description = "This is a subtask"
    project_id = $projectId
    parent_task_id = $parentTaskId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

$subtask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $subtaskBody -Headers $headers
$subtaskId = $subtask.id
Write-Host "  SUCCESS: Subtask created (ID: $subtaskId)" -ForegroundColor Green
Write-Host "  Parent ID: $($subtask.parent_task_id)" -ForegroundColor Gray

Write-Host "`n[2.3] DELETING subtask..." -ForegroundColor Yellow
$deleteSubtaskResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$subtaskId" -Method Delete -Headers $headers
Write-Host "  SUCCESS: Subtask deleted!" -ForegroundColor Green

Write-Host "`n[2.4] Verifying subtask is deleted..." -ForegroundColor Yellow
try {
    $deletedSubtask = Invoke-RestMethod -Uri "$baseUrl/tasks/$subtaskId" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  WARNING: Subtask still exists" -ForegroundColor Red
}
catch {
    Write-Host "  SUCCESS: Subtask not found (correctly deleted)" -ForegroundColor Green
}

Write-Host "`n[2.5] Verifying parent task still exists..." -ForegroundColor Yellow
$parentTaskCheck = Invoke-RestMethod -Uri "$baseUrl/tasks/$parentTaskId" -Method Get -Headers $headers
Write-Host "  SUCCESS: Parent task still exists (correct behavior)" -ForegroundColor Green

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

$commentTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $commentTaskBody -Headers $headers
$commentTaskId = $commentTask.id
Write-Host "  SUCCESS: Task created (ID: $commentTaskId)" -ForegroundColor Green

Write-Host "`n[3.2] Creating comment..." -ForegroundColor Yellow
$commentBody = @{
    task_id = $commentTaskId
    content = "This comment will be deleted"
} | ConvertTo-Json

$comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentBody -Headers $headers
$commentId = $comment.id
Write-Host "  SUCCESS: Comment created (ID: $commentId)" -ForegroundColor Green
Write-Host "  Content: $($comment.content)" -ForegroundColor Gray

Write-Host "`n[3.3] DELETING comment..." -ForegroundColor Yellow
$deleteCommentResponse = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Delete -Headers $headers
Write-Host "  SUCCESS: Comment deleted!" -ForegroundColor Green

Write-Host "`n[3.4] Verifying comment is deleted..." -ForegroundColor Yellow
try {
    $deletedComment = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  WARNING: Comment still exists" -ForegroundColor Red
}
catch {
    Write-Host "  SUCCESS: Comment not found (correctly deleted)" -ForegroundColor Green
}

Write-Host "`n[3.5] Verifying task still exists..." -ForegroundColor Yellow
$taskCheck = Invoke-RestMethod -Uri "$baseUrl/tasks/$commentTaskId" -Method Get -Headers $headers
Write-Host "  SUCCESS: Task still exists (correct behavior)" -ForegroundColor Green

# ============================================
# TEST 4: CASCADE DELETE (Task with Comments)
# ============================================
Write-Host "`n`n========================================" -ForegroundColor Magenta
Write-Host "  TEST 4: CASCADE DELETE" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`n[4.1] Creating task..." -ForegroundColor Yellow
$cascadeTaskBody = @{
    title = "Task with multiple comments"
    description = "This task will be deleted with its comments"
    project_id = $projectId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

$cascadeTask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $cascadeTaskBody -Headers $headers
$cascadeTaskId = $cascadeTask.id
Write-Host "  SUCCESS: Task created (ID: $cascadeTaskId)" -ForegroundColor Green

Write-Host "`n[4.2] Creating multiple comments..." -ForegroundColor Yellow
$commentIds = @()
for ($i = 1; $i -le 3; $i++) {
    $multiCommentBody = @{
        task_id = $cascadeTaskId
        content = "Comment #$i on task"
    } | ConvertTo-Json
    
    $multiComment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $multiCommentBody -Headers $headers
    $commentIds += $multiComment.id
    Write-Host "  SUCCESS: Comment #$i created (ID: $($multiComment.id))" -ForegroundColor Green
}

Write-Host "`n[4.3] Deleting task (should cascade delete comments)..." -ForegroundColor Yellow
$deleteTaskWithComments = Invoke-RestMethod -Uri "$baseUrl/tasks/$cascadeTaskId" -Method Delete -Headers $headers
Write-Host "  SUCCESS: Task deleted!" -ForegroundColor Green

Write-Host "`n[4.4] Verifying comments are also deleted..." -ForegroundColor Yellow
$allCommentsDeleted = $true
foreach ($cId in $commentIds) {
    try {
        $checkComment = Invoke-RestMethod -Uri "$baseUrl/comments/$cId" -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "  WARNING: Comment $cId still exists!" -ForegroundColor Red
        $allCommentsDeleted = $false
    }
    catch {
        Write-Host "  SUCCESS: Comment $cId deleted (cascade)" -ForegroundColor Green
    }
}

if ($allCommentsDeleted) {
    Write-Host "`n  SUCCESS: All comments cascaded correctly!" -ForegroundColor Green
}

# FINAL SUMMARY
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE OPERATIONS TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nTested Operations:" -ForegroundColor White
Write-Host "  - DELETE Task" -ForegroundColor Green
Write-Host "  - DELETE Subtask (via task endpoint)" -ForegroundColor Green
Write-Host "  - DELETE Comment" -ForegroundColor Green
Write-Host "  - CASCADE Delete (task with comments)" -ForegroundColor Green
Write-Host "`n========================================`n" -ForegroundColor Cyan
