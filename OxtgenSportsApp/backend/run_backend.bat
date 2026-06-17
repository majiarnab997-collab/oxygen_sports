@echo off
echo Starting Oxygen Sports Backend...
cd /d "%~dp0"
call venv\Scripts\activate
python --version
python app.py
pause