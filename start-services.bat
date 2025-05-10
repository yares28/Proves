@echo off
setlocal enabledelayedexpansion

echo Starting UPV Exam Calendar services...

REM Check if .env.local exists in root directory
if not exist .env.local (
    echo Error: .env.local file not found in root directory
    echo Please create .env.local with the following variables:
    echo SUPABASE_DB_URL=your_database_url
    echo SUPABASE_DB_USER=your_database_user
    echo SUPABASE_DB_PASSWORD=your_database_password
    exit /b 1
)

REM Load environment variables from .env.local
for /f "tokens=*" %%a in (.env.local) do (
    set %%a
)

REM Verify required variables are set
if "%SUPABASE_DB_URL%"=="" (
    echo Error: SUPABASE_DB_URL is not set in .env.local
    exit /b 1
)
if "%SUPABASE_DB_USER%"=="" (
    echo Error: SUPABASE_DB_USER is not set in .env.local
    exit /b 1
)
if "%SUPABASE_DB_PASSWORD%"=="" (
    echo Error: SUPABASE_DB_PASSWORD is not set in .env.local
    exit /b 1
)

REM Start Spring Boot backend
echo Starting Spring Boot backend...
start "Spring Boot Backend" cmd /c "cd backend && mvn spring-boot:run"

REM Wait for backend to start
timeout /t 10 /nobreak

REM Start Next.js frontend
echo Starting Next.js frontend...
start "Next.js Frontend" cmd /c "npm run dev"

echo Services started successfully!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000 