@echo off
REM Installiert und prueft die Toolchain-Voraussetzungen unter Windows.
REM Siehe docs\DEV_REQUIREMENTS.md Paragraf 1. Erwartet Node und Git bereits vorhanden.
setlocal enabledelayedexpansion

set "ROOT=%~dp0.."
pushd "%ROOT%"

set "NODE_MIN_MAJOR=22"

for /f "delims=" %%v in ('node -p "require('./package.json').packageManager.split('@')[1]" 2^>nul') do set "PNPM_VERSION=%%v"
if "%PNPM_VERSION%"=="" set "PNPM_VERSION=9.12.3"

set "FAILED=0"

echo Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo   fehlt  Node ^>= %NODE_MIN_MAJOR% installieren, dann erneut starten
  set "FAILED=1"
  goto :pnpm
)
for /f "delims=" %%v in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%v"
if !NODE_MAJOR! LSS %NODE_MIN_MAJOR% (
  echo   fehlt  node !NODE_MAJOR! ist aelter als %NODE_MIN_MAJOR%
  set "FAILED=1"
) else (
  for /f "delims=" %%v in ('node -v') do echo   ok     %%v
)

:pnpm
echo.
echo pnpm
where pnpm >nul 2>&1
if errorlevel 1 (
  echo   fehlt  corepack enable ^&^& corepack prepare pnpm@%PNPM_VERSION% --activate
  set "FAILED=1"
  goto :git
)
for /f "delims=" %%v in ('pnpm --version') do (
  if "%%v"=="%PNPM_VERSION%" (
    echo   ok     pnpm %%v
  ) else (
    echo   weicht pnpm %%v, packageManager verlangt %PNPM_VERSION%
  )
)

:git
echo.
echo Git
where git >nul 2>&1
if errorlevel 1 (
  echo   fehlt  git
  set "FAILED=1"
  goto :python
) else (
  echo   ok     git
)

:python
echo.
echo Python (optional)
where python >nul 2>&1
if errorlevel 1 (
  echo   skip   python fehlt, nur Helfer-Skripte brauchen es, der Build nie
) else (
  for /f "delims=" %%v in ('python --version 2^>^&1') do echo   ok     %%v
)

if "%FAILED%"=="1" (
  echo.
  echo Voraussetzungen fehlen. Behebe die Punkte oben und starte erneut.
  popd
  exit /b 1
)

echo.
echo Workspace-Dependencies
call pnpm install --frozen-lockfile
if errorlevel 1 (
  echo Install fehlgeschlagen.
  popd
  exit /b 1
)
echo   ok     pnpm install --frozen-lockfile durch

echo.
echo Gate
call pnpm run check
if errorlevel 1 (
  echo Gate fehlgeschlagen.
  popd
  exit /b 1
)

echo.
echo Toolchain komplett, alle Gates gruen.
popd
endlocal
exit /b 0
