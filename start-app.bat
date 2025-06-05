@echo off
setlocal enabledelayedexpansion

echo Starting Mdluex Search Application...

:: Ask user if they want to create a shareable link
set /p CREATE_TUNNEL="Do you want to create a shareable link? (y/n): "
if /i "!CREATE_TUNNEL!"=="y" (
    set USE_TUNNEL=1
    echo.
    echo Fetching tunnel password...
    for /f "tokens=*" %%a in ('curl -s https://loca.lt/mytunnelpassword') do (
        set "TUNNEL_PASSWORD=%%a"
    )
    echo Tunnel password: !TUNNEL_PASSWORD!
    echo.
    timeout /t 3 /nobreak >nul
) else (
    set USE_TUNNEL=0
)

:: Check if npx is available (comes with npm) if tunnel is requested
if %USE_TUNNEL%==1 (
    where npx >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Warning: npx is not available. Shareable links will not be available.
        echo This usually means npm is not properly installed.
        echo Please ensure Node.js and npm are properly installed.
        echo.
        set USE_TUNNEL=0
    )
)

:: Check if Ollama is installed
where ollama >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Ollama is not installed or not in PATH
    echo Please install Ollama from https://ollama.ai/download
    pause
    exit /b 1
)

:: Check if Ollama is already running
curl -s http://localhost:11434/api/tags >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Starting Ollama...
    start /B ollama serve
    :: Wait for Ollama to start
    :wait_ollama
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:11434/api/tags >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Waiting for Ollama to start...
        goto wait_ollama
    )
    echo Ollama started successfully
) else (
    echo Ollama is already running
)

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in PATH
    echo Please install Node.js which includes npm
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the application
echo Starting the application...
start /B npm run dev

:: Wait for the application to start
timeout /t 5 /nobreak >nul

:: Start Localtunnel if requested
if %USE_TUNNEL%==1 (
    echo Starting Localtunnel...
    :: Start Localtunnel in the background with custom subdomain
    start /B npx localtunnel --port 5173 --allow-invalid-cert --subdomain mdluex-search
    
    :: Wait a moment for the URL to be generated
    timeout /t 2 /nobreak >nul
    
)

:: Open the browser
start http://localhost:5173

echo.
echo Mdluex Search is now running!
echo - Ollama is running at http://localhost:11434
echo - Application is running at http://localhost:5173
if %USE_TUNNEL%==1 (
    echo - Localtunnel is running at: https://mdluex-search.loca.lt
    echo - Tunnel password: !TUNNEL_PASSWORD!
)
echo.
echo Press Ctrl+C in this window to stop all services
echo.

:: Keep the window open and handle cleanup on exit
:keep_alive
timeout /t 1 /nobreak >nul
goto keep_alive

:: Cleanup on exit
:cleanup
echo.
echo Stopping all services...
taskkill /F /IM ollama.exe >nul 2>nul
taskkill /F /IM node.exe >nul 2>nul
exit /b 0 