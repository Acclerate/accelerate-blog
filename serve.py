#!/usr/bin/env python3
"""本地预览脚本：优先用 Hugo 实时预览，未安装 Hugo 时回退为静态服务器。

用法:
    python serve.py            # 自动选择：hugo server (实时) 或 静态服务 public/
    python serve.py 8080       # 指定静态回退端口

说明:
    - 已安装 Hugo：运行 `hugo server -D`，自动打开 http://localhost:1313/
    - 未安装 Hugo：尝试 `hugo` 构建出 public/ 后用静态服务器提供；
      若 public/ 不存在也未装 Hugo，则直接以静态方式提供仓库根目录。
"""
import http.server
import socketserver
import threading
import webbrowser
import os
import sys
import shutil
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
HUGO_PORT = 1313
STATIC_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def static_serve(directory: str, port: int):
    os.chdir(directory)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), QuietHandler) as httpd:
        url = f"http://localhost:{port}/"
        print(f"静态服务器已启动: {url}")
        print("按 Ctrl+C 停止服务器。")
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止。")


def main():
    if shutil.which("hugo"):
        url = f"http://localhost:{HUGO_PORT}/"
        print(f"使用 Hugo 实时预览: {url}")
        threading.Timer(1.2, lambda: webbrowser.open(url)).start()
        try:
            subprocess.run(["hugo", "server", "-D", "--port", str(HUGO_PORT)])
        except KeyboardInterrupt:
            print("\n已停止。")
        return

    # 回退：构建并静态托管 public/
    public = os.path.join(ROOT, "public")
    if not os.path.isdir(public):
        print("未检测到 Hugo，尝试构建 public/ ...")
        try:
            subprocess.run(["hugo"], check=True, cwd=ROOT)
        except Exception:
            print("未安装 Hugo，无法构建。将以静态方式提供仓库根目录。")
            print("（要预览 Hugo 生成的页面，请先安装 Hugo Extended >= 0.146.0）")

    serve_dir = public if os.path.isdir(public) else ROOT
    static_serve(serve_dir, STATIC_PORT)


if __name__ == "__main__":
    main()
