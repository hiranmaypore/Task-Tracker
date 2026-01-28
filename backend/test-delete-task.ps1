# Test DELETE Task Endpoint

$baseUrl = "http://localhost:3000"
$testEmail = "deletetest_$(Get-Random)@example.com"
$testPassword = "TestPass123"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Testing DELETE Task Endpoint" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Register and Login
Write-Host "[1/6] Registering user..." -ForegroundColor Yellow
$registerBody = @{
    name = "Delete Test User"
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
Write-Host "  SUCCESS: User created" -ForegroundColor Green

Write-Host "`n[2/6] Logging in..." -ForegroundColor Yellow
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

# Step 2: Create Project
Write-Host "`n[3/6] Creating project..." -ForegroundColor Yellow
$projectBody = @{
    name = "Delete Test Project"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers
$projectId = $project.id
Write-Host "  SUCCESS: Project created (ID: $projectId)" -ForegroundColor Green

# Step 3: Create Task
Write-Host "`n[4/6] Creating task..." -ForegroundColor Yellow
$taskBody = @{
    title = "Task to be deleted"
    description = "This task will be deleted"
    project_id = $projectId
    status = "TODO"
    priority = "LOW"
} | ConvertTo-Json

$task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers
$taskId = $task.id
Write-Host "  SUCCESS: Task created (ID: $taskId)" -ForegroundColor Green
Write-Host "  Title: $($task.title)" -ForegroundColor Gray

# Step 4: Verify task exists
Write-Host "`n[5/6] Verifying task exists..." -ForegroundColor Yellow
try {
    $existingTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  SUCCESS: Task found" -ForegroundColor Green
    Write-Host "  Title: $($existingTask.title)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: Task not found" -ForegroundColor Red
}

# Step 5: DELETE the task
Write-Host "`n[6/6] DELETING task..." -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Delete -Headers $headers
    Write-Host "  SUCCESS: Task deleted!" -ForegroundColor Green
    Write-Host "  Response: $($deleteResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Verify task is deleted
Write-Host "`n[VERIFICATION] Checking if task still exists..." -ForegroundColor Yellow
try {
    $deletedTask = Invoke-RestMethod -Uri "$baseUrl/tasks/$taskId" -Method Get -Headers $headers
    Write-Host "  WARNING: Task still exists (should have been deleted)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  SUCCESS: Task not found (correctly deleted)" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DELETE Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
