# API Testing Script for To-Do List Backend
# This script tests all endpoints systematically

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Continue"

# Color functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Section { param($msg) Write-Host "`n========== $msg ==========" -ForegroundColor Yellow }

# Test variables
$testEmail = "test_$(Get-Random)@example.com"
$testPassword = "TestPass123"
$token = $null
$userId = $null
$projectId = $null
$taskId = $null
$commentId = $null

Write-Section "Starting API Tests"
Write-Info "Base URL: $baseUrl"
Write-Info "Test Email: $testEmail"

# Test 1: Server Health Check
Write-Section "1. Server Health Check"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method Get
    Write-Success "Server is running: $response"
} catch {
    Write-Error "Server is not responding: $($_.Exception.Message)"
    exit 1
}

# Test 2: User Registration
Write-Section "2. User Registration"
try {
    $registerBody = @{
        name = "Test User"
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    
    $userId = $response.id
    Write-Success "User registered successfully"
    Write-Info "User ID: $userId"
    Write-Info "Name: $($response.name)"
    Write-Info "Email: $($response.email)"
} catch {
    Write-Error "Registration failed: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 3: User Login
Write-Section "3. User Login"
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $response.access_token
    Write-Success "Login successful"
    Write-Info "Token: $($token.Substring(0, 50))..."
} catch {
    Write-Error "Login failed: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
    exit 1
}

# Test 4: Get All Users
Write-Section "4. Get All Users"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/users" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) user(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.name) ($($_.email))"
    }
} catch {
    Write-Error "Failed to get users: $($_.Exception.Message)"
}

# Test 5: Create Project
Write-Section "5. Create Project"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $projectBody = @{
        name = "Test Project - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/projects" `
        -Method Post `
        -Headers $headers `
        -Body $projectBody `
        -ContentType "application/json"
    
    $projectId = $response.id
    Write-Success "Project created successfully"
    Write-Info "Project ID: $projectId"
    Write-Info "Name: $($response.name)"
    Write-Info "Owner ID: $($response.owner_id)"
} catch {
    Write-Error "Failed to create project: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 6: Get All Projects
Write-Section "6. Get All Projects"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/projects" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) project(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.name) (ID: $($_.id))"
    }
} catch {
    Write-Error "Failed to get projects: $($_.Exception.Message)"
}

# Test 7: Create Task
Write-Section "7. Create Task"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $taskBody = @{
        title = "Test Task - Design Homepage"
        description = "Create a modern, responsive homepage design"
        project_id = $projectId
        status = "TODO"
        priority = "HIGH"
        due_date = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/tasks" `
        -Method Post `
        -Headers $headers `
        -Body $taskBody `
        -ContentType "application/json"
    
    $taskId = $response.id
    Write-Success "Task created successfully"
    Write-Info "Task ID: $taskId"
    Write-Info "Title: $($response.title)"
    Write-Info "Status: $($response.status)"
    Write-Info "Priority: $($response.priority)"
} catch {
    Write-Error "Failed to create task: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 8: Get All Tasks
Write-Section "8. Get All Tasks"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/tasks" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) task(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.title) [$($_.status)] [$($_.priority)]"
    }
} catch {
    Write-Error "Failed to get tasks: $($_.Exception.Message)"
}

# Test 9: Filter Tasks by Status
Write-Section "9. Filter Tasks by Status (TODO)"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/tasks?status=TODO" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) TODO task(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.title)"
    }
} catch {
    Write-Error "Failed to filter tasks: $($_.Exception.Message)"
}

# Test 10: Filter Tasks by Priority
Write-Section "10. Filter Tasks by Priority (HIGH)"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/tasks?priority=HIGH" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) HIGH priority task(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.title)"
    }
} catch {
    Write-Error "Failed to filter tasks by priority: $($_.Exception.Message)"
}

# Test 11: Search Tasks
Write-Section "11. Search Tasks (keyword: 'Design')"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/tasks?search=Design" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Found $($response.Count) task(s) matching 'Design'"
    $response | ForEach-Object {
        Write-Info "  - $($_.title)"
    }
} catch {
    Write-Error "Failed to search tasks: $($_.Exception.Message)"
}

# Test 12: Update Task
Write-Section "12. Update Task Status"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $updateBody = @{
        status = "IN_PROGRESS"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" `
        -Method Patch `
        -Headers $headers `
        -Body $updateBody `
        -ContentType "application/json"
    
    Write-Success "Task updated successfully"
    Write-Info "New Status: $($response.status)"
} catch {
    Write-Error "Failed to update task: $($_.Exception.Message)"
}

# Test 13: Create Comment
Write-Section "13. Create Comment"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $commentBody = @{
        task_id = $taskId
        content = "This is a test comment. Great progress on this task!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/comments" `
        -Method Post `
        -Headers $headers `
        -Body $commentBody `
        -ContentType "application/json"
    
    $commentId = $response.id
    Write-Success "Comment created successfully"
    Write-Info "Comment ID: $commentId"
    Write-Info "Content: $($response.content)"
    Write-Info "Author: $($response.user.name)"
} catch {
    Write-Error "Failed to create comment: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 14: Get Comments for Task
Write-Section "14. Get All Comments for Task"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/comments/task/$taskId" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Retrieved $($response.Count) comment(s)"
    $response | ForEach-Object {
        Write-Info "  - $($_.user.name): $($_.content)"
    }
} catch {
    Write-Error "Failed to get comments: $($_.Exception.Message)"
}

# Test 15: Update Comment
Write-Section "15. Update Comment"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $updateCommentBody = @{
        content = "Updated comment: Task is progressing well!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/comments/$commentId" `
        -Method Patch `
        -Headers $headers `
        -Body $updateCommentBody `
        -ContentType "application/json"
    
    Write-Success "Comment updated successfully"
    Write-Info "New Content: $($response.content)"
} catch {
    Write-Error "Failed to update comment: $($_.Exception.Message)"
}

# Test 16: Create Subtask
Write-Section "16. Create Subtask"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $subtaskBody = @{
        title = "Subtask - Choose Color Palette"
        description = "Select primary and secondary colors"
        project_id = $projectId
        parent_task_id = $taskId
        status = "TODO"
        priority = "MEDIUM"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/tasks" `
        -Method Post `
        -Headers $headers `
        -Body $subtaskBody `
        -ContentType "application/json"
    
    Write-Success "Subtask created successfully"
    Write-Info "Subtask ID: $($response.id)"
    Write-Info "Title: $($response.title)"
    Write-Info "Parent Task ID: $($response.parent_task_id)"
} catch {
    Write-Error "Failed to create subtask: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Info "Details: $($_.ErrorDetails.Message)"
    }
}

# Test 17: Get Task with Subtasks
Write-Section "17. Get Task Details (with subtasks)"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Task details retrieved"
    Write-Info "Title: $($response.title)"
    Write-Info "Subtasks: $($response.subtasks.Count)"
    if ($response.subtasks.Count -gt 0) {
        $response.subtasks | ForEach-Object {
            Write-Info "  - $($_.title)"
        }
    }
} catch {
    Write-Error "Failed to get task details: $($_.Exception.Message)"
}

# Test 18: Get Project Details
Write-Section "18. Get Project Details"
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" `
        -Method Get `
        -Headers $headers
    
    Write-Success "Project details retrieved"
    Write-Info "Name: $($response.name)"
    Write-Info "Tasks: $($response.tasks.Count)"
    Write-Info "Members: $($response.members.Count)"
} catch {
    Write-Error "Failed to get project details: $($_.Exception.Message)"
}

# Summary
Write-Section "Test Summary"
Write-Info "Test Email: $testEmail"
Write-Info "User ID: $userId"
Write-Info "Project ID: $projectId"
Write-Info "Task ID: $taskId"
Write-Info "Comment ID: $commentId"

Write-Host "`n" -NoNewline
Write-Success "All API tests completed!"
Write-Info "Check the output above for any errors."
Write-Host "`nYou can now:"
Write-Host "  1. View the data in MongoDB"
Write-Host "  2. Test additional endpoints manually"
Write-Host "  3. Use these IDs for further testing"
