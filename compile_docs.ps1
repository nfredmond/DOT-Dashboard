# PowerShell script to compile documentation files
$outputFile = "CAMP_TrendNav_MCP_Integration_Combined.md"

# Define an array of files to combine
$files = @(
    "docs\CAMP_TrendNavigator_Integration.md",
    "docs\camp_trendnavigator_integration_guide.md",
    "docs\CAMP Integration Technical Implementation Guide.md",
    "docs\DEVELOPMENT_PLAN.md", 
    "docs\MCP_AGENTS_INTEGRATION_SUMMARY.md",
    "docs\MCP_AGENTS_INTEGRATION.md",
    "docs\README.md",
    "docs\trend_champ_updates.txt"
)

# Create or clear the output file
"# Combined Documentation" | Out-File -FilePath $outputFile

# Process each file
foreach ($file in $files) {
    Write-Host "Processing $file..." -NoNewline
    
    if (Test-Path -Path $file -PathType Leaf) {
        # Add a section header with the filename
        "`n`n## From file: $file`n" | Out-File -FilePath $outputFile -Append
        
        # Get the content and append to the output file
        try {
            $content = Get-Content -Path $file -Raw
            $content | Out-File -FilePath $outputFile -Append
            Write-Host " Added successfully." -ForegroundColor Green
        } catch {
            Write-Host " Error reading file." -ForegroundColor Red
        }
    } else {
        Write-Host " File not found." -ForegroundColor Yellow
    }
}

Write-Host "`nCombined documentation created in $outputFile" -ForegroundColor Green 