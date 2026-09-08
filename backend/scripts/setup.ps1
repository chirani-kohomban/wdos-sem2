Write-Host "Setting up backend..."
# Ensure we are in the backend directory
Set-Location -Path "$PSScriptRoot"
# Install npm dependencies
npm install
# Initialize database (runs init_db.js which also seeds if needed)
node init_db.js
# Start the server
node server.js
