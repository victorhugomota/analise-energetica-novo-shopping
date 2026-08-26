@echo off
chcp 65001 > nul
echo =====================================================================
echo  3D AR CONDICIONADO - SINCRONIZADOR DE DADOS SITE/FIREBASE -> PPTX
echo =====================================================================
echo.
echo Conectando ao Firebase Firestore e recalculando metricas de engenharia...
echo.
python "%~dp0atualizar_powerpoint.py"
echo.
echo =====================================================================
echo  Sincronizacao concluida! O arquivo PowerPoint esta pronto.
echo =====================================================================
pause
