# Fix Next.js TypeScript Types Error Script
Write-Host "Fixing Next.js TypeScript types error..."

# Stop any running Next.js processes
$nextProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*next*" }
if ($nextProcesses) {
    Write-Host "Stopping Next.js processes..."
    $nextProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
}

# Remove .next/types directory if it exists
if(Test-Path .next\types) {
    Write-Host "Removing .next/types directory..."
    Remove-Item -Recurse -Force .next\types
}

# Create .next/types directory
Write-Host "Creating new .next/types directory with proper package.json..."
New-Item -ItemType Directory -Force -Path .next\types | Out-Null

# Create a valid package.json file in .next/types
$packageJson = @{
    name = "next-types"
    version = "1.0.0"
    description = "Next.js types"
    type = "module"
    private = $true
}
$packageJsonContent = $packageJson | ConvertTo-Json
Set-Content -Path .next\types\package.json -Value $packageJsonContent

# Update tsconfig.json to exclude .next directory
Write-Host "Updating tsconfig.json..."
$tsconfigPath = "tsconfig.json"
if(Test-Path $tsconfigPath) {
    $tsconfig = Get-Content -Raw $tsconfigPath | ConvertFrom-Json
    
    # Ensure .next is in the exclude list
    if(-not $tsconfig.exclude) {
        $tsconfig | Add-Member -MemberType NoteProperty -Name "exclude" -Value @("node_modules", ".next")
    } elseif($tsconfig.exclude -notcontains ".next") {
        $tsconfig.exclude += ".next"
    }
    
    # Remove .next/types from include if present
    if($tsconfig.include -contains ".next/types/**/*.ts") {
        $tsconfig.include = $tsconfig.include | Where-Object { $_ -ne ".next/types/**/*.ts" }
    }
    
    $tsconfig | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath
}

Write-Host "Fix completed successfully!"
Write-Host "You can now run 'npm run dev' or 'npm run build' without TypeScript errors." 