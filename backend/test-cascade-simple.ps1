# Simple test to check cascade delete with logging

$baseUrl = "http://localhost:3000"
$testEmail = "cascadetest_$(Get-Random)@example.com"
$testPassword = "TestPass123"

Write-Host "`nTesting Cascade Delete with Logging`n" -ForegroundColor Cyan

# Register and Login
$registerBody = @{
    name = "Cascade Test"
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
Write-Host "User created" -ForegroundColor Green

$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.access_token
Write-Host "Logged in" -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Create Project
$projectBody = @{
    name = "Cascade Test Project"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers
$projectId = $project.id
Write-Host "Project created: $projectId" -ForegroundColor Green

# Create Task
$taskBody = @{
    title = "Task with comments to delete"
    project_id = $projectId
    status = "TODO"
    priority = "HIGH"
} | ConvertTo-Json

$task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
$taskId = $task.id
Write-Host "Task created: $taskId" -ForegroundColor Green

# Create 3 Comments
Write-Host "`nCreating 3 comments..." -ForegroundColor Yellow
$commentIds = @()
for ($i = 1; $i -le 3; $i++) {
    $commentBody = @{
        task_id = $taskId
        content = "Test comment #$i"
    } | ConvertTo-Json
    
    $comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentBody -Headers $headers
    $commentIds += $comment.id
    Write-Host "  Comment #$i created: $($comment.id)" -ForegroundColor Gray
}

Write-Host "`nNow deleting task $taskId..." -ForegroundColor Yellow
Write-Host "Check server logs for [DELETE] messages`n" -ForegroundColor Cyan

# Delete Task
$deleteResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Delete -Headers $headers
Write-Host "Task deleted!" -ForegroundColor Green

# Wait a moment
Start-Sleep -Seconds 2

# Check if comments still exist
Write-Host "`nChecking if comments were cascade deleted..." -ForegroundColor Yellow
foreach ($cId in $commentIds) {
    try {
        $checkComment = Invoke-RestMethod -Uri "$baseUrl/comments/$cId" -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "  ✗ Comment $cId still exists!" -ForegroundColor Red
    }
    catch {
        Write-Host "  ✓ Comment $cId deleted (cascade worked!)" -ForegroundColor Green
    }
}

Write-Host "`nTest complete!`n" -ForegroundColor Cyan
