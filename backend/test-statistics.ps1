# Test Statistics API

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Statistics API Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ==================== SETUP ====================

Write-Host "[SETUP] Creating test user..." -ForegroundColor Yellow
$userEmail = "stats_tester_$(Get-Random)@example.com"
$userBody = @{
    name = "Stats Tester"
    email = $userEmail
    password = "TestPass123"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $userBody -ContentType "application/json"
$userId = $user.id
Write-Host "  User created: $userEmail (ID: $userId)" -ForegroundColor Green

Write-Host "`n[SETUP] Logging in..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{email=$userEmail;password="TestPass123"} | ConvertTo-Json) -ContentType "application/json"
$token = $login.access_token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
Write-Host "  User logged in" -ForegroundColor Green

# Create Project
Write-Host "`n[SETUP] Creating project..." -ForegroundColor Yellow
$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body (@{name="Stats Project"} | ConvertTo-Json) -Headers $headers
$projectId = $project.id
Write-Host "  Project created: $projectId" -ForegroundColor Green

# ==================== SEEDING DATA ====================

Write-Host "`n[ACTION] Seeding Tasks..." -ForegroundColor Yellow

# 1. Normal TODO Task
Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body (@{
    title = "Regular Task"
    project_id = $projectId
    status = "TODO"
    priority = "MEDIUM"
} | ConvertTo-Json) -Headers $headers | Out-Null
Write-Host "  + Task 1 (TODO)" -ForegroundColor Gray

# 2. Completed Task
Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body (@{
    title = "Completed Task"
    project_id = $projectId
    status = "DONE"
    priority = "HIGH"
} | ConvertTo-Json) -Headers $headers | Out-Null
Write-Host "  + Task 2 (DONE)" -ForegroundColor Gray

# 3. Task Due Today (Active)
$today = (Get-Date).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body (@{
    title = "Due Today Task"
    project_id = $projectId
    status = "IN_PROGRESS"
    priority = "HIGH"
    due_date = $today
} | ConvertTo-Json) -Headers $headers | Out-Null
Write-Host "  + Task 3 (IN_PROGRESS, Due Today)" -ForegroundColor Gray

# 4. Overdue Task
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body (@{
    title = "Overdue Task"
    project_id = $projectId
    status = "TODO"
    priority = "LOW"
    due_date = $yesterday
} | ConvertTo-Json) -Headers $headers | Out-Null
Write-Host "  + Task 4 (TODO, Overdue)" -ForegroundColor Gray

# ==================== DEBUG INSPECTION ====================

Write-Host "`n[DEBUG] Inspecting Created Tasks..." -ForegroundColor False
$tasks = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Get -Headers $headers
foreach ($t in $tasks) {
    $status = $t.status
    $due = if ($t.due_date) { $t.due_date } else { "NULL" }
    Write-Host "  - Task: $($t.title) | Status: $status | Due: $due" -ForegroundColor Gray
}

# ==================== VERIFICATION ====================

Write-Host "`n[VERIFY] Getting Dashboard Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/statistics/dashboard" -Method Get -Headers $headers
    
    Write-Host "`nDashboard Overview:" -ForegroundColor Cyan
    Write-Host "  Total Projects: $($stats.overview.total_projects) (Expected: 1)" -ForegroundColor White
    Write-Host "  Total Tasks:    $($stats.overview.total_tasks) (Expected: 4)" -ForegroundColor White
    Write-Host "  Completed:      $($stats.overview.completed_tasks) (Expected: 1)" -ForegroundColor White
    Write-Host "  Completion %:   $($stats.overview.completion_rate)% (Expected: 25)" -ForegroundColor White
    
    Write-Host "`nAttention Needed:" -ForegroundColor Cyan
    Write-Host "  Due Today:      $($stats.attention_needed.due_today) (Expected: 1)" -ForegroundColor White
    Write-Host "  Overdue:        $($stats.attention_needed.overdue) (Expected: 1)" -ForegroundColor White
    
    # Assertions
    $passed = $true
    if ($stats.overview.total_tasks -ne 4) { $passed = $false; Write-Host "  ❌ Total Tasks Mismatch" -ForegroundColor Red }
    if ($stats.overview.completed_tasks -ne 1) { $passed = $false; Write-Host "  ❌ Completed Tasks Mismatch" -ForegroundColor Red }
    if ($stats.attention_needed.due_today -ne 1) { $passed = $false; Write-Host "  ❌ Due Today Mismatch" -ForegroundColor Red }
    if ($stats.attention_needed.overdue -ne 1) { $passed = $false; Write-Host "  ❌ Overdue Mismatch" -ForegroundColor Red }
    
    if ($passed) {
        Write-Host "  ✅ DASHBOARD STATS CORRECT" -ForegroundColor Green
    }

} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[VERIFY] Getting Project Stats..." -ForegroundColor Yellow
try {
    $pStats = Invoke-RestMethod -Uri "$baseUrl/statistics/project/$projectId" -Method Get -Headers $headers
    
    Write-Host "`nProject Stats:" -ForegroundColor Cyan
    Write-Host "  Total:     $($pStats.completion.total) (Expected: 4)" -ForegroundColor White
    Write-Host "  Completed: $($pStats.completion.completed) (Expected: 1)" -ForegroundColor White
    
    Write-Host "`nTop Performers:" -ForegroundColor Cyan
    foreach ($p in $pStats.top_performers) {
        Write-Host "  - $($p.user.name): $($p.completed_tasks) tasks" -ForegroundColor Gray
    }
    
    if ($pStats.completion.total -eq 4 -and $pStats.completion.completed -eq 1) {
        Write-Host "  ✅ PROJECT STATS CORRECT" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PROJECT STATS MISMATCH" -ForegroundColor Red
    }

} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
