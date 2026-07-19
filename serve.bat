@echo off
REM 启动本地预览：优先 Hugo 实时预览，否则回退为静态服务器
pushd "%~dp0"
python "%~dp0serve.py"
popd
pause
