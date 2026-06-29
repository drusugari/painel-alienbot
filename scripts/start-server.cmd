@echo off
cd /d "%~dp0.."
node "%CD%\node_modules\.pnpm\next@14.2.35_react-dom@18.3.1_react@18.3.1__react@18.3.1\node_modules\next\dist\bin\next" start --hostname 127.0.0.1 --port 3000 > "%CD%\dev-server.log" 2> "%CD%\dev-server.err"
