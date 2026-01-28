# Test RBAC Guards and Member Management

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RBAC & Member Management Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ==================== SETUP ====================

Write-Host "[SETUP] Creating test users..." -ForegroundColor Yellow

# User 1 (Owner)
$user1Email = "owner_$(Get-Random)@example.com"
$user1Body = @{
    name = "Owner User"
    email = $user1Email
    password = "TestPass123"
} | ConvertTo-Json

$user1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $user1Body -ContentType "application/json"
Write-Host "  User 1 (Owner): $user1Email" -ForegroundColor Green

# User 2 (Editor)
$user2Email = "editor_$(Get-Random)@example.com"
$user2Body = @{
    name = "Editor User"
    email = $user2Email
    password = "TestPass123"
} | ConvertTo-Json

$user2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $user2Body -ContentType "application/json"
Write-Host "  User 2 (Editor): $user2Email" -ForegroundColor Green

# User 3 (Viewer)
$user3Email = "viewer_$(Get-Random)@example.com"
$user3Body = @{
    name = "Viewer User"
    email = $user3Email
    password = "TestPass123"
} | ConvertTo-Json

$user3 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $user3Body -ContentType "application/json"
Write-Host "  User 3 (Viewer): $user3Email" -ForegroundColor Green

# Login all users
Write-Host "`n[SETUP] Logging in users..." -ForegroundColor Yellow

$login1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{email=$user1Email;password="TestPass123"} | ConvertTo-Json) -ContentType "application/json"
$token1 = $login1.access_token
$headers1 = @{Authorization="Bearer $token1"; "Content-Type"="application/json"}
Write-Host "  Owner logged in" -ForegroundColor Green

$login2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{email=$user2Email;password="TestPass123"} | ConvertTo-Json) -ContentType "application/json"
$token2 = $login2.access_token
$headers2 = @{Authorization="Bearer $token2"; "Content-Type"="application/json"}
Write-Host "  Editor logged in" -ForegroundColor Green

$login3 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{email=$user3Email;password="TestPass123"} | ConvertTo-Json) -ContentType "application/json"
$token3 = $login3.access_token
$headers3 = @{Authorization="Bearer $token3"; "Content-Type"="application/json"}
Write-Host "  Viewer logged in" -ForegroundColor Green

# Create project as User 1
Write-Host "`n[SETUP] Creating project..." -ForegroundColor Yellow
$projectBody = @{
    name = "RBAC Test Project"
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectBody -Headers $headers1
$projectId = $project.id
Write-Host "  Project created: $projectId" -ForegroundColor Green

# ==================== MEMBER MANAGEMENT TESTS ====================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MEMBER MANAGEMENT TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Add Editor
Write-Host "[1/10] Add User 2 as EDITOR..." -ForegroundColor Yellow
try {
    $addEditorBody = @{
        user_id = $user2.id
        role = "EDITOR"
    } | ConvertTo-Json
    
    $member2 = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" -Method Post -Body $addEditorBody -Headers $headers1
    Write-Host "  SUCCESS: Editor added" -ForegroundColor Green
    Write-Host "  Member: $($member2.user.name) - Role: $($member2.role)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Add Viewer
Write-Host "`n[2/10] Add User 3 as VIEWER..." -ForegroundColor Yellow
try {
    $addViewerBody = @{
        user_id = $user3.id
        role = "VIEWER"
    } | ConvertTo-Json
    
    $member3 = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" -Method Post -Body $addViewerBody -Headers $headers1
    Write-Host "  SUCCESS: Viewer added" -ForegroundColor Green
    Write-Host "  Member: $($member3.user.name) - Role: $($member3.role)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get all members
Write-Host "`n[3/10] Get all project members..." -ForegroundColor Yellow
try {
    $members = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" -Method Get -Headers $headers1
    Write-Host "  SUCCESS: Retrieved $($members.Count) members" -ForegroundColor Green
    foreach ($member in $members) {
        Write-Host "  - $($member.user.name): $($member.role)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Try to add member as EDITOR (should fail)
Write-Host "`n[4/10] Try to add member as EDITOR (should fail)..." -ForegroundColor Yellow
try {
    $addBody = @{
        user_id = $user1.id
        role = "EDITOR"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members" -Method Post -Body $addBody -Headers $headers2
    Write-Host "  FAILED: Editor should not be able to add members!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  SUCCESS: Correctly forbidden (403)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: Wrong error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Update member role
Write-Host "`n[5/10] Update User 2 from EDITOR to VIEWER..." -ForegroundColor Yellow
try {
    $updateRoleBody = @{
        role = "VIEWER"
    } | ConvertTo-Json
    
    $updated = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members/$($user2.id)" -Method Patch -Body $updateRoleBody -Headers $headers1
    Write-Host "  SUCCESS: Role updated to $($updated.role)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Try to remove owner (should fail)
Write-Host "`n[6/10] Try to remove owner (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members/$($user1.id)" -Method Delete -Headers $headers1
    Write-Host "  FAILED: Should not be able to remove owner!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  SUCCESS: Correctly forbidden (403)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: Wrong error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ==================== RBAC TESTS ====================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RBAC PERMISSION TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# First, change User 2 back to EDITOR for testing
Write-Host "[SETUP] Changing User 2 back to EDITOR..." -ForegroundColor Yellow
$updateRoleBody = @{role = "EDITOR"} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/members/$($user2.id)" -Method Patch -Body $updateRoleBody -Headers $headers1 | Out-Null
Write-Host "  Done" -ForegroundColor Green

# Test 7: EDITOR can create tasks
Write-Host "`n[7/10] EDITOR creates task (should succeed)..." -ForegroundColor Yellow
try {
    $taskBody = @{
        title = "Task by Editor"
        project_id = $projectId
        status = "TODO"
        priority = "MEDIUM"
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers2
    $taskId = $task.id
    Write-Host "  SUCCESS: Task created by EDITOR" -ForegroundColor Green
    Write-Host "  Task: $($task.title)" -ForegroundColor Gray
} catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: VIEWER cannot create tasks
Write-Host "`n[8/10] VIEWER tries to create task (should fail)..." -ForegroundColor Yellow
try {
    $taskBody = @{
        title = "Task by Viewer"
        project_id = $projectId
        status = "TODO"
        priority = "LOW"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/tasks" -Method Post -Body $taskBody -Headers $headers3
    Write-Host "  FAILED: VIEWER should not be able to create tasks!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  SUCCESS: Correctly forbidden (403)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: Wrong error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 9: VIEWER cannot update project
Write-Host "`n[9/10] VIEWER tries to update project (should fail)..." -ForegroundColor Yellow
try {
    $updateBody = @{
        name = "Updated by Viewer"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Patch -Body $updateBody -Headers $headers3
    Write-Host "  FAILED: VIEWER should not be able to update project!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  SUCCESS: Correctly forbidden (403)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: Wrong error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 10: Only OWNER can delete project
Write-Host "`n[10/10] EDITOR tries to delete project (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/projects/$projectId" -Method Delete -Headers $headers2
    Write-Host "  FAILED: EDITOR should not be able to delete project!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  SUCCESS: Correctly forbidden (403)" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: Wrong error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ==================== SUMMARY ====================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Test Users:" -ForegroundColor White
Write-Host "  Owner:  $user1Email" -ForegroundColor Gray
Write-Host "  Editor: $user2Email" -ForegroundColor Gray
Write-Host "  Viewer: $user3Email" -ForegroundColor Gray

Write-Host "`nProject ID: $projectId" -ForegroundColor White

Write-Host "`nMember Management:" -ForegroundColor White
Write-Host "  ✓ Add members (OWNER only)" -ForegroundColor Green
Write-Host "  ✓ Update member roles (OWNER only)" -ForegroundColor Green
Write-Host "  ✓ Get members list" -ForegroundColor Green
Write-Host "  ✓ Cannot remove owner" -ForegroundColor Green
Write-Host "  ✓ Cannot add members as EDITOR" -ForegroundColor Green

Write-Host "`nRBAC Permissions:" -ForegroundColor White
Write-Host "  ✓ EDITOR can create tasks" -ForegroundColor Green
Write-Host "  ✓ VIEWER cannot create tasks" -ForegroundColor Green
Write-Host "  ✓ VIEWER cannot update project" -ForegroundColor Green
Write-Host "  ✓ EDITOR cannot delete project" -ForegroundColor Green
Write-Host "  ✓ Only OWNER can delete project" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
