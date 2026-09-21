# Refresh the portable, per-commit export requested at D:\ass clone.
# Run from D:\ass_sd after a new security branch is merged. It adds only the
# explicit commits below and preserves their original author, timestamp,
# message and changed-file snapshot for hand replay.

$ErrorActionPreference = 'Stop'

$exportRoot = 'D:\ass clone'
$apiRoot = 'D:\ass_sd\work\pubudu-pos-api-secure'
$webRoot = 'D:\ass_sd\work\pubudu-pos-front-end-secure'

$commits = @(
    [pscustomobject]@{ Repo='api'; Root=$apiRoot; Branch='fix-ravindu-hibp-test-isolation'; Commit='a6e7eff095802e9fc01c46c0fdaa2f63c403caa6'; Number=1; Folder='01 a6e7eff test(v05)- make breach-password check deterministic'; Kind='COPY' },
    [pscustomobject]@{ Repo='api'; Root=$apiRoot; Branch='main'; Commit='c399bb66bae5d34143a081806c75919bbbd132bf'; Number=8; Folder='08 c399bb6 Merge - deterministic V-05 breach test'; Kind='MERGE' },
    [pscustomobject]@{ Repo='api'; Root=$apiRoot; Branch='feat-nimthara-cost-exposure'; Commit='9e5cc203918a40ab78ce625977a52170c49a0c64'; Number=1; Folder='01 9e5cc20 fix(v20)- prevent cashier cost and margin disclosure'; Kind='COPY' },
    [pscustomobject]@{ Repo='api'; Root=$apiRoot; Branch='main'; Commit='5b8748260e6d9e961c225dffb29a0a8bfff5a407'; Number=9; Folder='09 5b87482 Merge - V-20 cost disclosure control'; Kind='MERGE' },
    [pscustomobject]@{ Repo='web'; Root=$webRoot; Branch='feat-malith-server-authoritative-invoice-ui'; Commit='dcad23316e35dfeba799fb4da455b3beec75d4a6'; Number=1; Folder='01 dcad233 fix(v10)- minimize client-authored invoice fields'; Kind='COPY' },
    [pscustomobject]@{ Repo='web'; Root=$webRoot; Branch='main'; Commit='215d696eb42ac911903d1bd63ccdcca4e2cd8d6d'; Number=6; Folder='06 215d696 Merge - V-10 invoice request boundary'; Kind='MERGE' }
)

function Format-GitDate([string]$value) {
    $date = [DateTimeOffset]::Parse($value)
    return $date.ToString('yyyy-MM-dd HH:mm:ss') + ' ' + $date.ToString('zzz').Replace(':', '')
}

function Get-Metadata($entry) {
    $lines = @(& git -C $entry.Root show -s --format='%H%n%P%n%an%n%ae%n%aI%n%cn%n%ce%n%cI%n%B' $entry.Commit)
    [pscustomobject]@{
        Hash = $lines[0]
        Parents = $lines[1]
        Author = $lines[2]
        AuthorEmail = $lines[3]
        AuthorDate = $lines[4]
        Committer = $lines[5]
        CommitterEmail = $lines[6]
        CommitDate = $lines[7]
        Message = ($lines | Select-Object -Skip 8) -join "`n"
    }
}

foreach ($entry in $commits) {
    $branchFolder = Join-Path $exportRoot "$($entry.Repo) - $($entry.Branch)"
    $commitFolder = Join-Path $branchFolder $entry.Folder
    $meta = Get-Metadata $entry

    if (-not (Test-Path -LiteralPath $commitFolder)) {
        New-Item -ItemType Directory -Force -Path $commitFolder | Out-Null
        $changes = @(& git -C $entry.Root diff-tree --no-commit-id --name-status -r -M $entry.Commit)
        $parentShort = (($meta.Parents -split ' ' | Where-Object { $_ }) | ForEach-Object { $_.Substring(0, 7) }) -join ' '
        $message = @(
            "Commit:       $($meta.Hash)",
            "Author:       $($meta.Author) <$($meta.AuthorEmail)>",
            "Date:         $(Format-GitDate $meta.AuthorDate)",
            "Committer:    $($meta.Committer) <$($meta.CommitterEmail)>",
            "Commit date:  $(Format-GitDate $meta.CommitDate)",
            "Repository:   $($entry.Repo)",
            "Branch:       $($entry.Branch)",
            "Parents:      $parentShort",
            '',
            'Message',
            '-------',
            $meta.Message.Trim(),
            '',
            'Files in this commit (A = added, M = changed, D = deleted, R = renamed)',
            '------------------------------------------------------------------------'
        )

        if ($entry.Kind -eq 'MERGE') {
            $message += @(
                'This is an integration merge. Its source files are represented by the earlier',
                'COPY commit folders, so there are no duplicate files here.'
            )
        } else {
            $message += $changes
            $copyPaths = @()
            foreach ($change in $changes) {
                $parts = $change -split "`t"
                if ($parts[0] -match '^[AM]') { $copyPaths += $parts[1] }
                if ($parts[0] -match '^[RC]') { $copyPaths += $parts[2] }
            }
            if ($copyPaths.Count -gt 0) {
                $archive = Join-Path $commitFolder 'commit-files.tar'
                & git -C $entry.Root archive --format=tar "--output=$archive" $entry.Commit -- $copyPaths
                tar -xf $archive -C $commitFolder
                Remove-Item -LiteralPath $archive -Force
            }
            $message += @('', "$($copyPaths.Count) file(s) copied into this folder as they were in this commit; deleted files are only listed.")
        }

        Set-Content -LiteralPath (Join-Path $commitFolder 'commit-message.txt') -Value ($message -join "`r`n") -Encoding utf8
    }

    $branchList = Join-Path $branchFolder 'branch-commits.txt'
    if (-not (Test-Path -LiteralPath $branchList)) {
        New-Item -ItemType Directory -Force -Path $branchFolder | Out-Null
        @(
            "Repository: $($entry.Repo)",
            "Remote:     $(git -C $entry.Root remote get-url origin)",
            "Branch:     $($entry.Branch)",
            'Commits:    1',
            '',
            ('{0:D2}  {1}  {2}  {3}' -f $entry.Number, $meta.Hash.Substring(0,7), ([DateTimeOffset]::Parse($meta.CommitDate)).ToString('yyyy-MM-dd'), ($meta.Message -split "`n")[0])
        ) | Set-Content -LiteralPath $branchList -Encoding utf8
    } elseif (-not ((Get-Content -Raw $branchList) -match $meta.Hash.Substring(0,7))) {
        Add-Content -LiteralPath $branchList -Value ('{0:D2}  {1}  {2}  {3}' -f $entry.Number, $meta.Hash.Substring(0,7), ([DateTimeOffset]::Parse($meta.CommitDate)).ToString('yyyy-MM-dd'), ($meta.Message -split "`n")[0]) -Encoding utf8
    }
}

# Existing main-branch index files are extended above; keep their count truthful.
foreach ($branchFile in ($commits | ForEach-Object {
    Join-Path $exportRoot "$($_.Repo) - $($_.Branch)\branch-commits.txt"
} | Select-Object -Unique)) {
    $lines = Get-Content -LiteralPath $branchFile
    $count = @($lines | Where-Object { $_ -match '^\d{2}\s+' }).Count
    $lines = $lines -replace '^Commits:\s+\d+', "Commits:    $count"
    Set-Content -LiteralPath $branchFile -Value $lines -Encoding utf8
}

$orderFile = Join-Path $exportRoot 'commit-order.txt'
$existingOrder = Get-Content -Raw $orderFile
$nextStep = 34
foreach ($entry in $commits) {
    if ($existingOrder -notmatch $entry.Commit.Substring(0,7)) {
        $meta = Get-Metadata $entry
        $line = '{0,-5} {1,-20} {2,-6} {3,-4} {4}\{5}' -f $nextStep, ([DateTimeOffset]::Parse($meta.CommitDate)).ToString('yyyy-MM-dd HH:mm:ss'), $entry.Kind, $entry.Repo, "$($entry.Repo) - $($entry.Branch)", $entry.Folder
        Add-Content -LiteralPath $orderFile -Value $line -Encoding utf8
        $nextStep++
    }
}

$orderLines = Get-Content -LiteralPath $orderFile
$commitCount = @($orderLines | Where-Object { $_ -match '^\d+\s+\d{4}-\d{2}-\d{2}' }).Count
$orderLines = $orderLines -replace '^All \d+ commits', "All $commitCount commits"
$orderLines = $orderLines -replace '^  Ravindu Bandara Subasinha\s+\d+ commits', "  Ravindu Bandara Subasinha          $commitCount commits"
Set-Content -LiteralPath $orderFile -Value $orderLines -Encoding utf8

$readme = Join-Path $exportRoot 'README.txt'
if (-not ((Get-Content -Raw $readme) -match 'V-20 cost disclosure')) {
    Add-Content -LiteralPath $readme -Value "`r`nUpdate 2026-09-21: added V-20 backend response filtering, deterministic V-05 HIBP test coverage, and Malith's V-10 frontend request boundary. Export now contains 39 security commits/merges." -Encoding utf8
}

Write-Output 'D:\ass clone refreshed: six additional commits exported.'
