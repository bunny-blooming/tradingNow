param(
    [string]$RepoName = "tradingNow",
    [ValidateSet("private", "public")]
    [string]$Visibility = "public"
)

$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is not installed or not available in PATH."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI is not installed or not available in PATH. Install it from https://cli.github.com/"
}

gh auth status | Out-Host

if (-not (Test-Path -LiteralPath ".git\HEAD")) {
    git init
    git branch -M main
}

$gitUserName = git config user.name
if ([string]::IsNullOrWhiteSpace($gitUserName)) {
    $gitHubLogin = gh api user --jq ".login"
    git config user.name $gitHubLogin
}

$gitUserEmail = git config user.email
if ([string]::IsNullOrWhiteSpace($gitUserEmail)) {
    $gitHubId = gh api user --jq ".id"
    $gitHubLogin = gh api user --jq ".login"
    git config user.email "$gitHubId+$gitHubLogin@users.noreply.github.com"
}

$publishFiles = @(
    ".gitignore",
    ".nojekyll",
    "README.md",
    "reset.html",
    "index.html",
    "styles.css",
    "app.js",
    "manifest.json",
    "service-worker.js",
    "publish_to_github.ps1",
    "start_phone_server.bat",
    "assets/bunnyeap-symbol-tight.png",
    "assets/bunnyeap-symbol.png",
    "assets/bunnyeap-symbol-192.png",
    "assets/bunnyeap-symbol-512.png"
)

git add $publishFiles

$stagedFiles = @(git diff --cached --name-only)
if ($stagedFiles.Count -gt 0) {
    git commit -m "Update Bunnyeap trading note PWA"
    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed. Check the error above and run this script again."
    }
} else {
    Write-Host "No staged changes to commit."
}

$commitCount = ""
try {
    $commitCount = (git rev-list --count HEAD 2>$null)
} catch {
    $commitCount = ""
}
if ([string]::IsNullOrWhiteSpace($commitCount) -or [int]$commitCount -eq 0) {
    git add -f $publishFiles
    git commit -m "Add Bunnyeap trading note PWA"
    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed. Check the error above and run this script again."
    }
}

$remotes = @(git remote)
$hasOrigin = $remotes -contains "origin"

if (-not $hasOrigin) {
    gh repo create $RepoName "--$Visibility" --source . --remote origin --push
} else {
    git push -u origin main
}

Write-Host ""
Write-Host "Done. Repository:"
gh repo view --web

Write-Host ""
Write-Host "Next step: enable GitHub Pages"
Write-Host "1. Open the repository Settings tab."
Write-Host "2. Go to Pages."
Write-Host "3. Source: Deploy from a branch."
Write-Host "4. Branch: main, folder: / (root)."
Write-Host "5. Save, then open the Pages URL on your phone."
