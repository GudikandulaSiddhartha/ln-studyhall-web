@echo off
set "Path=C:\Program Files\nodejs;C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0"
cd /d "%~dp0apps\web"
"C:\Program Files\nodejs\node.exe" "..\..\node_modules\next\dist\bin\next" dev --hostname 127.0.0.1
