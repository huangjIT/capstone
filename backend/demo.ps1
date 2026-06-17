param()

$baseUrl = 'http://localhost:8080'
Write-Host "========================================"
Write-Host "  PET SOCIAL - 10 Record PoC Demo"
Write-Host "========================================"




# 1) Health check
Write-Host "`n[1] Health Check..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/system/health" -Method GET -TimeoutSec 5
    Write-Host "OK - System is LIVE"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
    exit 1
}

# 2) Register 10 users
Write-Host "`n[2] Registering 10 users..."
$userIds = New-Object System.Collections.ArrayList
$i = 0
while ($i -lt 10) {
    $i++
    $prefMask = @(1, 3, 5, 7)[($i % 4)]

    $userJson = @{
        name = "TestUser_$i"
        email = "testuser$i@example.com"
        role = "PET_OWNER"
        isActive = $true
        matchPreferencesMask = $prefMask
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method Post -Body $userJson -ContentType 'application/json' -TimeoutSec 10
        $userIds.Add($result.id) | Out-Null
        Write-Host "  User ${i}: ID=$($result.id)"
    } catch {
        Write-Host "  User $i FAILED"
    }
}
Write-Host "Registered: $($userIds.Count) users"

# 3) Send 10 telemetry records
Write-Host "`n[3] Sending 10 telemetry records..."
$teleCount = 0
$j = 0
while ($j -lt 10) {
    if ($j -lt $userIds.Count) {
        $userId = $userIds[$j]
        $lat = 40.7128 + (0.01 * $j)
        $lon = -74.0060 + (0.01 * $j)

        $telemetryJson = @{
            userId = $userId
            latitude = $lat
            longitude = $lon
        } | ConvertTo-Json

        try {
            $result = Invoke-RestMethod -Uri "$baseUrl/api/telemetry/location" -Method Post -Body $telemetryJson -ContentType 'application/json' -TimeoutSec 10
            $teleCount++
            Write-Host "  Telemetry ${j}: sent for user $userId"
        } catch {
            Write-Host "  Telemetry $j FAILED"
        }
    }
    $j++
}
Write-Host "Sent: $teleCount records"

# 4) Run match requests
Write-Host "`n[4] Running 3 match requests..."
$matchCount = 0
$matches = @(
    @{ lat = 40.7128; lon = -74.0060; pref = 5 },
    @{ lat = 40.7138; lon = -74.0070; pref = 3 },
    @{ lat = 40.7148; lon = -74.0080; pref = 1 }
)

foreach ($match in $matches) {
    $matchJson = @{
        searchLatitude = $match.lat
        searchLongitude = $match.lon
        preferencesMask = $match.pref
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/match" -Method Post -Body $matchJson -ContentType 'application/json' -TimeoutSec 10
        $matchCount++
        if ($result.userId) {
            Write-Host "  Match OK: User $($result.userId)"
        } else {
            Write-Host "  Match: No User found"
        }
    } catch {
        Write-Host "  Match FAILED"
    }
}
Write-Host "Matches run: $matchCount"

# 5) Get metrics
Write-Host "`n[5] Dashboard Metrics..."
try {
    $metrics = Invoke-RestMethod -Uri "$baseUrl/dashboard/api/metrics" -Method GET -TimeoutSec 10

    Write-Host "`nMETRICS SUMMARY"
    Write-Host "======================================="
    Write-Host "Users:"
    Write-Host "  Total: $($metrics.users.total)"
    Write-Host "  Available: $($metrics.users.available)"
    Write-Host "  In Geo Index: $($metrics.users.inGeoIndex)"
    Write-Host ""
    Write-Host "Telemetry:"
    Write-Host "  Total Processed: $($metrics.telemetry.totalProcessed)"
    Write-Host ""
    Write-Host "Matching:"
    Write-Host "  Successful: $($metrics.matching.successfulMatches)"
    Write-Host "  Failed: $($metrics.matching.failedMatches)"
    Write-Host "  Success Rate: $($metrics.matching.successRate)"
    Write-Host ""
    Write-Host "System:"
    Write-Host "  Status: $($metrics.summary.status)"
    Write-Host "  Data Points: $($metrics.summary.dataPoints)"

    $metrics | ConvertTo-Json -Depth 6 | Out-File 'logs\metrics_10record_poc.json' -Encoding utf8
    Write-Host "`nMetrics saved to logs\metrics_10record_poc.json"

} catch {
    Write-Host "FAILED to fetch metrics: $($_.Exception.Message)"
}

# Summary
Write-Host "`n========================================"
Write-Host "  PoC DEMO COMPLETE"
Write-Host "========================================"
Write-Host "`nSummary:"
Write-Host "  Users registered: $($UserIds.Count)"
Write-Host "  Telemetry sent: $teleCount"
Write-Host "  Matches run: $matchCount"
Write-Host "`nLinks:"
Write-Host "  Dashboard: http://localhost:8080/dashboard"
Write-Host "  Prometheus: http://localhost:9090"
Write-Host "  Grafana: http://localhost:3000"

