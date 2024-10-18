#!/bin/bash

# 変数の定義
repo_dir="videochat/v4"

# ルートチェック関数
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "このスクリプトはスーパーユーザー権限で実行する必要があります。"
        exit 1
    fi
}

# Gitがインストールされているか確認
check_git() {
    if ! command -v git &> /dev/null; then
        echo "Gitがインストールされていません。インストールしてください。"
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
    cd "$repo_dir" || { echo "ディレクトリに移動できませんでした。"; exit 1; }
    npm install
    if [ $? -ne 0 ]; then
        echo "npm installに失敗しました。"
        exit 1
    fi
    pm2 start server.js --name "videochat"
    echo "アプリが起動しました。"
}

delete_app() {
    echo "アプリを削除します..."
    pm2 stop videochat
    pm2 delete videochat
    rm -rf "$repo_dir"
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
check_git

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
            if [ -d "$repo_dir" ]; then
                read -p "既にクローン済みです。削除して再インストールしますか？ (y/n): " reinstall_choice
                if [[ "$reinstall_choice" == "y" ]]; then
                    delete_app
                    git clone https://github.com/hirotomoki12345/videochat.git
                    cd "$repo_dir"
                    start_app
                else
                    start_app
                fi
            else
                git clone https://github.com/hirotomoki12345/videochat.git
                cd "$repo_dir"
                start_app
            fi
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
