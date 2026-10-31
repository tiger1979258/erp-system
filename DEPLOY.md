# ERP系统 — 快速部署指南

## 推荐方案：Railway 一键部署（最简单）

Railway 提供 MySQL + Node.js + 静态托管 全免费套餐，支持 Docker Compose 一键部署。

### 前置条件
- GitHub 账号
- Railway 账号（可用 GitHub 直接登录：https://railway.app）

### 部署步骤

#### 第一步：上传代码到 GitHub

1. 将 `erp-system` 文件夹压缩为 `erp-system.zip`
2. 在 GitHub 创建新仓库，上传并解压
3. 确保仓库结构为：
   ```
   /
   ├── docker-compose.yml
   ├── init.sql
   ├── Dockerfile.backend
   ├── Dockerfile.frontend
   ├── render.yaml
   ├── backend/
   └── frontend/
   ```

#### 第二步：Railway 一键部署

1. 打开 https://railway.app → **Login with GitHub**
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你刚上传的仓库 → **Deploy Now**
4. Railway 会自动识别 `docker-compose.yml` 并部署全部服务
5. 等待 3-5 分钟，部署完成后会生成公网访问地址

#### 第三步：初始化数据

部署完成后，在浏览器访问：
```
https://你的后端服务域名/api/seed
```
看到返回 `"演示数据初始化完成！"` 即表示成功。

#### 第四步：访问系统

打开前端服务域名（如 `https://erp-frontend-production.up.railway.app`）即可使用。

---

## 备选方案：Render 部署

### 前置条件
- GitHub 账号
- Render 账号（https://render.com，可用 GitHub 登录）

### 部署步骤

#### 1. 部署 MySQL 数据库

1. Render 控制台 → **New +** → **PostgreSQL**
2. 名称填 `erp-mysql`，计划选 **Free**
3. 创建后进入详情页 → 找到 **Connection** 信息
4. 通过 Render Shell 连接数据库，执行项目中的 `init.sql` 建表

#### 2. 部署后端

1. **New +** → **Web Service**
2. 连接 GitHub 仓库，根目录选择 `backend`
3. 运行时：**Node**，构建命令留空，启动命令：`node server.js`
4. 环境变量（Environment Variables）：
   ```
   DB_HOST = 你的MySQL主机
   DB_PORT = 3306
   DB_USER = 你的MySQL用户名
   DB_PASSWORD = 你的MySQL密码
   DB_NAME = erp_system
   PORT = 10000
   ```
5. 计划选 **Free** → **Create Web Service**

#### 3. 部署前端

1. **New +** → **Static Site**
2. 连接 GitHub 仓库，根目录选择 `frontend`
3. 构建命令：`npm install && npm run build`
4. 发布目录：`build`
5. **Rewrites & Redirects** 中添加：
   ```
   Source: /api/*
   Destination: https://你的后端域名.onrender.com/api/:splat
   ```
6. **Create Static Site**

#### 4. 初始化数据

访问：`https://你的后端域名.onrender.com/api/seed`

---

## 本地 Docker 测试

如果你电脑上安装了 Docker Desktop：

```bash
cd erp-system
docker-compose up -d
```

访问 http://localhost 即可使用，然后访问 http://localhost/api/seed 初始化数据。

---

## 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Express   │────▶│    MySQL    │
│  前端页面   │     │  后端API    │     │   数据库    │
└─────────────┘     └─────────────┘     └─────────────┘
     Ant Design          mysql2           8.0
```

| 模块 | 说明 |
|------|------|
| 商品管理 | SKU基础数据维护 |
| 入库管理 | 采购入库单，多商品明细，实际进价核算 |
| 销售出库 | 销售单，自动计算收入/成本/毛利 |
| 库存台账 | 实时库存，安全库存预警（红/黄/绿） |
| 生产工单 | 工单创建、进度跟踪、领料出库 |
| 财务管理 | 收支记录、分类统计、净收益计算 |
| 工作台 | 关键指标卡片、库存概览 |

---

## 注意事项

1. **Render 免费版**：15分钟无请求会休眠，首次访问需等待约30秒冷启动
2. **Railway 免费版**：$5/月额度，足够小项目使用
3. **数据库密码**：生产环境请修改为强密码
4. **演示数据**：包含6个月的采购/销售/生产/财务记录，可直接体验全流程

---

## 系统截图预览

系统包含7个核心页面：
- 工作台（仪表盘）
- 商品管理（CRUD）
- 入库管理（采购单）
- 销售出库（销售单 + 毛利计算）
- 库存台账（实时库存 + 预警）
- 生产工单（工单 + 领料）
- 财务管理（收支记录 + 汇总）
