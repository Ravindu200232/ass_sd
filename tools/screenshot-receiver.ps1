$ErrorActionPreference = 'Stop'

$root = 'D:\ass_sd\video\Ravindu'
$folders = @{
    'V01' = 'Vulnerability 01 - Public Registration'
    'V02' = 'Vulnerability 02 - Missing Role Authorization'
    'V03' = 'Vulnerability 03 - Cross Branch IDOR'
    'V05' = 'Vulnerability 05 - Authentication Weaknesses'
    'V06' = 'Vulnerability 06 - Token Lifecycle'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8765/')
$listener.Start()
Write-Host 'Screenshot receiver listening on http://127.0.0.1:8765/'

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            if ($context.Request.HttpMethod -ne 'POST') {
                $response.StatusCode = 405
                $body = [Text.Encoding]::UTF8.GetBytes('POST only')
                $response.OutputStream.Write($body, 0, $body.Length)
                continue
            }

            $folderKey = $context.Request.QueryString['folder']
            $fileName = $context.Request.QueryString['file']
            if (-not $folders.ContainsKey($folderKey) -or
                [string]::IsNullOrWhiteSpace($fileName) -or
                $fileName -notmatch '^[A-Za-z0-9][A-Za-z0-9 ._-]*\.png$') {
                $response.StatusCode = 400
                $body = [Text.Encoding]::UTF8.GetBytes('Invalid folder or file name')
                $response.OutputStream.Write($body, 0, $body.Length)
                continue
            }

            $folderPath = Join-Path $root $folders[$folderKey]
            [System.IO.Directory]::CreateDirectory($folderPath) | Out-Null
            $targetPath = Join-Path $folderPath $fileName

            $stream = [System.IO.File]::Open($targetPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
            try {
                $context.Request.InputStream.CopyTo($stream)
            } finally {
                $stream.Dispose()
            }

            $size = (Get-Item -LiteralPath $targetPath).Length
            $response.StatusCode = 200
            $body = [Text.Encoding]::UTF8.GetBytes("saved $fileName ($size bytes)")
            $response.OutputStream.Write($body, 0, $body.Length)
            Write-Host "Saved $folderKey/$fileName ($size bytes)"
        } catch {
            $response.StatusCode = 500
            $body = [Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
            $response.OutputStream.Write($body, 0, $body.Length)
            Write-Host "Receiver error: $($_.Exception.Message)"
        } finally {
            $response.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
