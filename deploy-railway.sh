#!/bin/bash
# ERP系统 - 一键部署到Railway
# 前置要求：已安装 Railway CLI (https://docs.railway.app/develop/cli)

set -e

echo "========================================"
echo "  ERP系统 - Railway 一键部署脚本"
echo "========================================"

# 1. 登录Railway
echo ""
echo "[1/5] 请先在浏览器中登录Railway..."
railway login

# 2. 初始化项目
echo ""
echo "[2/5] 初始化Railway项目..."
cd "$(dirname "$0")"
railway init -e production

# 3. 添加MySQL数据库
echo ""
echo "[3/5] 添加MySQL数据库..."
railway add -d mysql

# 4. 链接后端服务
echo ""
echo "[4/5] 部署后端服务..."
cd backend
railway up --service backend --detach

# 5. 链接前端服务
echo ""
echo "[5/5] 部署前端服务..."
cd ../frontend
railway up --service frontend --detach

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "接下来请手动配置环境变量："
echo "  1. 在Railway控制台找到MySQL服务，获取连接信息"
echo "  2. 在后端服务的Variables中设置："
echo "     DB_HOST = MySQL主机地址"
echo "     DB_PORT = 3306"
echo "     DB_USER = MySQL用户名"
echo "     DB_PASSWORD = MySQL密码"
echo "     DB_NAME = erp_system"
echo "  3. 在前端服务的rewrite规则中添加："
echo "     /api/* -> 后端服务域名/api/:splat"
echo ""
echo "初始化演示数据："
echo "  访问: https://你的后端域名/api/seed"
echo ""
echo "查看部署状态: railway status"
echo "查看日志: railway logs"
echo "打开控制台: railway open"
echo ""
