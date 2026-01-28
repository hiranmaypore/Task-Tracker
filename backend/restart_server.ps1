Write-Host "Stopping any running Node.js processes..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "Generating Prisma Client..."
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting Backend Server..."
    npm run start:dev
} else {
    Write-Host "Prisma Generate Failed!"
}
