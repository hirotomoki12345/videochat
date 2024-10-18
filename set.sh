#!/bin/bash

# ルートチェック関数
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "このスクリプトはスーパーユーザー権限で実行する必要があります。"
        exit 1
    fi
}

# 必要な関数の定義
install_nvm() {
    if ! command -v nvm &> /dev/null; then
        echo "NVMをインストールします..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install node
    else
        echo "NVMは既にインストールされています。"
    fi
}

install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo "PM2をインストールします..."
        npm install -g pm2
    else
        echo "PM2は既にインストールされています。"
    fi
}

start_app() {
    echo "アプリを起動します..."
    cd videochat/v5
    npm install
    pm2 start server.js --name "videochat"
    echo "アプリが起動しました。"
}

delete_app() {
    echo "アプリを削除します..."
    pm2 stop videochat
    pm2 delete videochat
    cd ..
    rm -rf videochat
    echo "アプリが削除されました。"
}

view_logs() {
    echo "ログを表示します..."
    pm2 logs videochat
}

quit() {
    echo "終了します。"
    exit 0
}

# ルート権限を確認
check_root

# メインのループ
while true; do
    echo "操作を選択してください:"
    echo "1: 起動"
    echo "2: 削除（ディレクトリも）"
    echo "3: ログを見る"
    echo "4: quit"

    read -p "選択肢を入力してください（1/2/3/4）: " choice

    case $choice in
        1)
            install_nvm
            install_pm2
            git clone https://github.com/hirotomoki12345/videochat.git
            start_app
            ;;
        2)
            delete_app
            ;;
        3)
            view_logs
            ;;
        4)
            quit
            ;;
        *)
            echo "無効な選択です。再度入力してください。"
            ;;
    esac
done
