@echo off
REM デスクトップの personal-cashbook を WSL から起動する（この .bat をデスクトップにコピーしても可）
REM フォルダを Desktop 以外に置いた場合は、下の cd のパスだけ書き換えてください。

wsl.exe bash -lc "cd '/mnt/c/Users/%USERNAME%/Desktop/personal-cashbook' && source .venv/bin/activate && exec python -m streamlit run app.py"

echo.
echo Streamlit を終了しました。ウィンドウを閉じるには何かキーを押してください。
pause >nul
