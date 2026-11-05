#!/bin/zsh
cd -- "${0:A:h}" || exit 1
/usr/bin/python3 tools/serve34.py 8766 &
game_server=$!
trap 'kill "$game_server" 2>/dev/null' EXIT
sleep 1
if ! kill -0 "$game_server" 2>/dev/null; then
 print '起動できませんでした。ポート8766が使用中か確認してください。'
 exit 1
fi
/usr/bin/open 'http://127.0.0.1:8766/index.html'
print '3年4組の本編を開きました。このウィンドウを閉じると終了します。'
wait "$game_server"
