$response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "`nHeaders:"
$response.Headers.Keys | ForEach-Object {
    Write-Host "$_ : $($response.Headers[$_])"
}
