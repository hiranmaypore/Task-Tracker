# Simple API Testing Script
# Tests all endpoints of the To-Do List Backend

$baseUrl = "http://localhost:3000"
$testEmail = "testuser_$(Get-Random)@example.com"
$testPassword = "TestPass123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  API Testing - To-Do List Backend" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Server Health
Write-Host "[1/18] Testing Server Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method Get
    Write-Host "  SUCCESS: $response" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Register User
Write-Host "`n[2/18] Registering User..." -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor Gray
try {
    $body = @{
        name = "Test User"
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  SUCCESS: User registered (ID: $($user.id))" -ForegroundColor Green
    $userId = $user.id
} catch {
    $errorMsg = $_.ErrorDetails.Message
    Write-Host "  FAILED: $errorMsg" -ForegroundColor Red
    exit 1
}

# Test 3: Login
Write-Host "`n[3/18] Logging In..." -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "  SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create headers for authenticated requests
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 4: Get Users
Write-Host "`n[4/18] Getting All Users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Retrieved $($users.Count) user(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Create Project
Write-Host "`n[5/18] Creating Project..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Test Project - $(Get-Date -Format 'HH:mm:ss')"
    } | ConvertTo-Json

    $project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $body -Headers $headers
    $projectId = $project.id
    Write-Host "  SUCCESS: Project created (ID: $projectId)" -ForegroundColor Green
    Write-Host "  Name: $($project.name)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 6: Get Projects
Write-Host "`n[6/18] Getting All Projects..." -ForegroundColor Yellow
try {
    $projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Retrieved $($projects.Count) project(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Create Task
Write-Host "`n[7/18] Creating Task..." -ForegroundColor Yellow
try {
    $body = @{
        title = "Design Homepage"
        description = "Create a modern homepage design"
        project_id = $projectId
        status = "TODO"
        priority = "HIGH"
    } | ConvertTo-Json

    $task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $body -Headers $headers
    $taskId = $task.id
    Write-Host "  SUCCESS: Task created (ID: $taskId)" -ForegroundColor Green
    Write-Host "  Title: $($task.title)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 8: Get All Tasks
Write-Host "`n[8/18] Getting All Tasks..." -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Retrieved $($tasks.Count) task(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Filter Tasks by Status
Write-Host "`n[9/18] Filtering Tasks (status=TODO)..." -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "$baseUrl/tasks?status=TODO" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Found $($tasks.Count) TODO task(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Filter Tasks by Priority
Write-Host "`n[10/18] Filtering Tasks (priority=HIGH)..." -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "$baseUrl/tasks?priority=HIGH" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Found $($tasks.Count) HIGH priority task(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: Search Tasks
Write-Host "`n[11/18] Searching Tasks (search=Design)..." -ForegroundColor Yellow
try {
    $tasks = Invoke-RestMethod -Uri "$baseUrl/tasks?search=Design" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Found $($tasks.Count) matching task(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Update Task
Write-Host "`n[12/18] Updating Task Status..." -ForegroundColor Yellow
try {
    $body = @{
        status = "IN_PROGRESS"
    } | ConvertTo-Json

    $updatedTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Patch -Body $body -Headers $headers
    Write-Host "  SUCCESS: Task updated to $($updatedTask.status)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 13: Create Comment
Write-Host "`n[13/18] Creating Comment..." -ForegroundColor Yellow
try {
    $body = @{
        task_id = $taskId
        content = "Great progress on this task!"
    } | ConvertTo-Json

    $comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $body -Headers $headers
    $commentId = $comment.id
    Write-Host "  SUCCESS: Comment created (ID: $commentId)" -ForegroundColor Green
    Write-Host "  Content: $($comment.content)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 14: Get Comments for Task
Write-Host "`n[14/18] Getting Comments for Task..." -ForegroundColor Yellow
try {
    $comments = Invoke-RestMethod -Uri "$baseUrl/comments/task/$taskId" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Retrieved $($comments.Count) comment(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 15: Update Comment
Write-Host "`n[15/18] Updating Comment..." -ForegroundColor Yellow
try {
    $body = @{
        content = "Updated: Task is progressing well!"
    } | ConvertTo-Json

    $updatedComment = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" -Method Patch -Body $body -Headers $headers
    Write-Host "  SUCCESS: Comment updated" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 16: Create Subtask
Write-Host "`n[16/18] Creating Subtask..." -ForegroundColor Yellow
try {
    $body = @{
        title = "Choose Color Palette"
        description = "Select colors for the design"
        project_id = $projectId
        parent_task_id = $taskId
        status = "TODO"
        priority = "MEDIUM"
    } | ConvertTo-Json

    $subtask = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $body -Headers $headers
    Write-Host "  SUCCESS: Subtask created (ID: $($subtask.id))" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 17: Get Task with Subtasks
Write-Host "`n[17/18] Getting Task Details..." -ForegroundColor Yellow
try {
    $taskDetails = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Task has $($taskDetails.subtasks.Count) subtask(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 18: Get Project Details
Write-Host "`n[18/18] Getting Project Details..." -ForegroundColor Yellow
try {
    $projectDetails = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Project has $($projectDetails.tasks.Count) task(s)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Email:   $testEmail" -ForegroundColor White
Write-Host "User ID:      $userId" -ForegroundColor White
Write-Host "Project ID:   $projectId" -ForegroundColor White
Write-Host "Task ID:      $taskId" -ForegroundColor White
Write-Host "Comment ID:   $commentId" -ForegroundColor White
Write-Host "`nAll tests completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
