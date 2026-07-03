param()

$baseUrl = 'http://localhost:8080'
Write-Host "========================================"
Write-Host "  PET SOCIAL - End-to-End Demo"
Write-Host "========================================"

function Get-StatusCode($err) {
    try { return $err.Exception.Response.StatusCode.value__ } catch { return 0 }
}

# 1) Health check
Write-Host "`n[1] Health Check..."
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/system/health" -Method GET -TimeoutSec 5
    Write-Host "OK - System is LIVE"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
    exit 1
}

# 2) Register 10 users (idempotent: falls back to login when the email already exists,
#    so the demo can be re-run against the same database)
Write-Host "`n[2] Registering 10 users..."
$users = New-Object System.Collections.ArrayList   # each entry: @{ id; token; email }

function Register-DemoUser($name, $email, $prefMask) {
    $userJson = @{
        name = $name
        email = $email
        password = "demopass123"
        role = "PET_OWNER"
        active = $true
        matchPreferencesMask = $prefMask
    } | ConvertTo-Json
    return Invoke-RestMethod -Uri "$baseUrl/api/users/register" -Method Post -Body $userJson -ContentType 'application/json' -TimeoutSec 10
}

$i = 0
while ($i -lt 10) {
    $i++
    $prefMask = @(1, 3, 5, 7)[($i % 4)]
    $email = "testuser$i@example.com"

    try {
        $result = Register-DemoUser "TestUser_$i" $email $prefMask
        $users.Add(@{ id = $result.id; token = $result.token; email = $email }) | Out-Null
        Write-Host "  User ${i}: registered, ID=$($result.id)"
        continue
    } catch { }

    # Email already taken (previous run) - log in instead to get id + JWT
    $loginJson = @{ email = $email; password = "demopass123" } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method Post -Body $loginJson -ContentType 'application/json' -TimeoutSec 10
        $users.Add(@{ id = $result.id; token = $result.token; email = $email }) | Out-Null
        Write-Host "  User ${i}: already exists, logged in, ID=$($result.id)"
        continue
    } catch { }

    # Email is taken by an account this demo can't log into (e.g. legacy rows with no
    # password hash) - register a fresh uniquely-suffixed account instead
    $suffix = Get-Date -Format 'yyyyMMddHHmmss'
    $freshEmail = "testuser$i-$suffix@example.com"
    try {
        $result = Register-DemoUser "TestUser_$i" $freshEmail $prefMask
        $users.Add(@{ id = $result.id; token = $result.token; email = $freshEmail }) | Out-Null
        Write-Host "  User ${i}: legacy email unusable, registered $freshEmail, ID=$($result.id)"
    } catch {
        Write-Host "  User $i FAILED: $($_.Exception.Message)"
    }
}
Write-Host "Users ready: $($users.Count)"
if ($users.Count -eq 0) {
    Write-Host "No users available - aborting demo."
    exit 1
}

# 3) Create pets for the first 3 users (skipped when the owner already has pets)
Write-Host "`n[3] Creating pets..."
$petSpecs = @(
    @{ name = "Rex";  species = "DOG"; breed = "Labrador"; emoji = [char]::ConvertFromUtf32(0x1F415) },
    @{ name = "Milo"; species = "CAT"; breed = "Tabby";    emoji = [char]::ConvertFromUtf32(0x1F431) },
    @{ name = "Coco"; species = "DOG"; breed = "Poodle";   emoji = [char]::ConvertFromUtf32(0x1F429) }
)
$petCount = 0
for ($p = 0; $p -lt [Math]::Min(3, $users.Count); $p++) {
    $owner = $users[$p]
    try {
        $existing = Invoke-RestMethod -Uri "$baseUrl/api/pets/owner/$($owner.id)" -Method GET -TimeoutSec 10
        if (@($existing).Count -gt 0) {
            Write-Host "  Owner $($owner.id): already has $(@($existing).Count) pet(s)"
            $petCount++
            continue
        }
    } catch { }

    $spec = $petSpecs[$p]
    $petJson = @{
        ownerId = $owner.id
        name = $spec.name
        species = $spec.species
        breed = $spec.breed
        avatarEmoji = $spec.emoji
        vaccinated = $true
        availableForPlaydate = $true
        personalityTags = @("Friendly", "Playful")
    } | ConvertTo-Json

    try {
        $pet = Invoke-RestMethod -Uri "$baseUrl/api/pets" -Method Post -Body $petJson -ContentType 'application/json' -TimeoutSec 10
        $petCount++
        Write-Host "  Pet created: $($spec.name) (ID=$($pet.id)) for owner $($owner.id)"
    } catch {
        Write-Host "  Pet for owner $($owner.id) FAILED"
    }
}
Write-Host "Pets ready: $petCount"

# 4) Send telemetry for every user
Write-Host "`n[4] Sending telemetry records..."
$teleCount = 0
for ($j = 0; $j -lt $users.Count; $j++) {
    $userId = $users[$j].id
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
Write-Host "Sent: $teleCount records"

# 5) Wait for the Kafka consumer to flush locations into the Redis geo index
#    (matching and discovery read from Redis, so racing ahead makes them miss)
Write-Host "`n[5] Waiting for telemetry to reach the geo index..."
$deadline = (Get-Date).AddSeconds(20)
$geoCount = 0
while ((Get-Date) -lt $deadline) {
    try {
        $m = Invoke-RestMethod -Uri "$baseUrl/dashboard/api/metrics" -Method GET -TimeoutSec 5
        $geoCount = [int]$m.users.inGeoIndex
        if ($geoCount -ge $users.Count) { break }
    } catch { }
    Start-Sleep -Seconds 1
}
Write-Host "Geo index population: $geoCount user(s)"

# 6) Run match requests (404 = no match found, which is a valid outcome, not an error)
Write-Host "`n[6] Running 3 match requests..."
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
        Write-Host "  Match OK: User $($result.userId)"
    } catch {
        if ((Get-StatusCode $_) -eq 404) {
            $matchCount++
            Write-Host "  Match: no user found (valid no-match result)"
        } else {
            Write-Host "  Match FAILED: $($_.Exception.Message)"
        }
    }
}
Write-Host "Matches run: $matchCount"

# 7) JWT-protected messaging: user1 -> user2, then read user2's inbox with their token
Write-Host "`n[7] Messaging (Bearer-token protected)..."
if ($users.Count -ge 2) {
    $sender = $users[0]
    $receiver = $users[1]
    $senderHeaders = @{ Authorization = "Bearer $($sender.token)" }
    $receiverHeaders = @{ Authorization = "Bearer $($receiver.token)" }

    $msgJson = @{
        receiverId = $receiver.id
        content = "Hey! Want to take the dogs for a walk this evening?"
    } | ConvertTo-Json

    try {
        $sent = Invoke-RestMethod -Uri "$baseUrl/api/messages" -Method Post -Headers $senderHeaders -Body $msgJson -ContentType 'application/json' -TimeoutSec 10
        Write-Host "  Message sent: user $($sender.id) -> user $($receiver.id) (ID=$($sent.id))"
    } catch {
        Write-Host "  Message send FAILED: $($_.Exception.Message)"
    }

    try {
        $convos = Invoke-RestMethod -Uri "$baseUrl/api/messages/conversations" -Method GET -Headers $receiverHeaders -TimeoutSec 10
        Write-Host "  User $($receiver.id) inbox: $(@($convos).Count) conversation(s)"
        foreach ($c in @($convos) | Select-Object -First 3) {
            Write-Host "    From $($c.otherUserName): '$($c.lastMessage)' ($($c.time))"
        }
    } catch {
        Write-Host "  Conversations FAILED: $($_.Exception.Message)"
    }

    try {
        $unread = Invoke-RestMethod -Uri "$baseUrl/api/messages/unread-count" -Method GET -Headers $receiverHeaders -TimeoutSec 10
        Write-Host "  User $($receiver.id) unread count: $($unread.count)"
    } catch {
        Write-Host "  Unread count FAILED: $($_.Exception.Message)"
    }

    # Prove the gate works: no token must be rejected with 401
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/messages/conversations" -Method GET -TimeoutSec 10 | Out-Null
        Write-Host "  WARNING: conversations endpoint accepted a request without a token!"
    } catch {
        if ((Get-StatusCode $_) -eq 401) {
            Write-Host "  Auth gate OK: request without token rejected (401)"
        } else {
            Write-Host "  Auth gate check inconclusive: $($_.Exception.Message)"
        }
    }
} else {
    Write-Host "  Skipped (needs at least 2 users)"
}

# 8) Discovery endpoints (Redis geo + Postgres joined per request)
Write-Host "`n[8] Discovery..."
try {
    $nearby = Invoke-RestMethod -Uri "$baseUrl/api/pets/nearby?lat=40.7128&lon=-74.0060&radiusKm=10&limit=50" -Method GET -TimeoutSec 10
    Write-Host "  Nearby pets: $(@($nearby).Count)"
    foreach ($n in @($nearby) | Select-Object -First 3) {
        Write-Host "    $($n.emoji) $($n.name) ($($n.breed)) - owner: $($n.owner)"
    }
} catch {
    Write-Host "  Nearby pets FAILED: $($_.Exception.Message)"
}

try {
    $requester = $users[$users.Count - 1]
    $partners = Invoke-RestMethod -Uri "$baseUrl/api/pets/partners?userId=$($requester.id)&lat=40.7128&lon=-74.0060" -Method GET -TimeoutSec 10
    Write-Host "  Walking partners for user $($requester.id): $(@($partners).Count)"
    foreach ($w in @($partners) | Select-Object -First 3) {
        $onlineText = "offline"
        if ($w.online) { $onlineText = "online" }
        Write-Host "    $($w.emoji) $($w.name) - $($w.distance) - owner $($w.owner) ($onlineText)"
    }
} catch {
    Write-Host "  Walking partners FAILED: $($_.Exception.Message)"
}

# 9) Get metrics
Write-Host "`n[9] Dashboard Metrics..."
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
    Write-Host "Social:"
    Write-Host "  Pets: $($metrics.social.pets)"
    Write-Host "  Matches: $($metrics.social.matches)"
    Write-Host "  Messages: $($metrics.social.messages)"
    Write-Host "  Notifications: $($metrics.social.notifications)"
    Write-Host ""
    Write-Host "System:"
    Write-Host "  Status: $($metrics.summary.status)"
    Write-Host "  Data Points: $($metrics.summary.dataPoints)"

    if (-not (Test-Path 'logs')) { New-Item -ItemType Directory -Path 'logs' | Out-Null }
    $metrics | ConvertTo-Json -Depth 6 | Out-File 'logs\metrics_demo.json' -Encoding utf8
    Write-Host "`nMetrics saved to logs\metrics_demo.json"

} catch {
    Write-Host "FAILED to fetch metrics: $($_.Exception.Message)"
}

# Summary
Write-Host "`n========================================"
Write-Host "  DEMO COMPLETE"
Write-Host "========================================"
Write-Host "`nSummary:"
Write-Host "  Users ready: $($users.Count)"
Write-Host "  Pets ready: $petCount"
Write-Host "  Telemetry sent: $teleCount"
Write-Host "  Matches run: $matchCount"
Write-Host "`nLinks:"
Write-Host "  Dashboard: http://localhost:8080/dashboard"
Write-Host "  Prometheus: http://localhost:9090"
Write-Host "  Grafana: http://localhost:3000"
