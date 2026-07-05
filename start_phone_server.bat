@echo off
setlocal

cd /d "%~dp0"

set "PORT=5173"
set "PYTHON_EXE=python"
set "BUNDLED_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if exist "%BUNDLED_PY%" (
  set "PYTHON_EXE=%BUNDLED_PY%"
)

echo.
echo Starting Bunnyeap Trading Note phone server...
echo Folder: %CD%
echo.
echo Open this on your phone while it is on the same Wi-Fi:
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' } | ForEach-Object { '  http://' + $_.IPAddress + ':%PORT%/reset.html' }"
echo.
echo Keep this window open while using the app on your phone.
echo Press Ctrl+C to stop the server.
echo.

"%PYTHON_EXE%" -m http.server %PORT% --bind 0.0.0.0

echo.
pause
