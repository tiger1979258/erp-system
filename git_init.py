# -*- coding: utf-8 -*-
import subprocess
import os
import sys

repo_dir = r"C:\Users\钟虎\Documents\erp-system"
git_exe = r"C:\Users\钟虎\Documents\PortableGit\cmd\git.exe"

def git(*args):
    result = subprocess.run([git_exe] + list(args), cwd=repo_dir, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"  [stderr] {result.stderr.strip()}")
    return result.stdout.strip()

print("=" * 60)
print("  ERP系统 - GitHub 仓库初始化")
print("=" * 60)

# 0. 验证 Git
print("\n[0/6] 验证 Git...")
ver = git("--version")
print(f"  {ver}")

# 1. 初始化仓库
print("\n[1/6] 初始化 Git 仓库...")
if os.path.exists(os.path.join(repo_dir, ".git")):
    print("  仓库已存在，跳过")
else:
    git("init")
    print("  OK")

# 2. 配置用户信息
print("\n[2/6] 配置 Git 用户信息...")
# 尝试读取已有配置
config_path = os.path.join(repo_dir, ".git", "config")
existing_name = ""
if os.path.exists(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()
        import re
        m = re.search(r'name = (.+)', content)
        if m: existing_name = m.group(1).strip()

if not existing_name:
    git("config", "user.name", "ERP-User")
    git("config", "user.email", "erp-user@local")
    print("  已设置默认用户信息（推送时需替换为你的GitHub用户名和邮箱）")
else:
    print(f"  已有: {existing_name}")

# 3. .gitignore
print("\n[3/6] 检查 .gitignore...")
gi = os.path.join(repo_dir, ".gitignore")
if not os.path.exists(gi):
    with open(gi, "w", encoding="utf-8") as f:
        f.write("node_modules/\nbuild/\n.env\n*.log\n.DS_Store\nThumbs.db\n.vscode/\n.idea/\n")
    print("  已创建")
else:
    print("  已存在")

# 4. 添加
print("\n[4/6] 添加文件...")
short = git("status", "--short")
count = len(short.splitlines()) if short else 0
print(f"  待提交文件: {count} 个")
git("add", ".")
print("  OK")

# 5. 提交
print("\n[5/6] 提交...")
commit_msg = """feat: ERP系统 - 进销存+生产+财务全功能

- 商品/供应商/客户基础数据管理
- 入库单/销售出库单（含毛利自动计算）
- 库存台账（安全库存预警）
- 生产工单（领料出库、进度跟踪）
- 财务管理（收支记录、净收益汇总）
- 工作台仪表盘（关键指标卡片）
- Docker Compose 一键部署
- 预填6个月演示数据"""

result = subprocess.run([git_exe, "commit", "-m", commit_msg], cwd=repo_dir, capture_output=True, text=True, encoding='utf-8')
if result.returncode == 0:
    print("  提交成功！")
else:
    if "nothing to commit" in result.stdout:
        print("  没有变更需要提交")
    else:
        print(f"  [stderr] {result.stderr.strip()}")
        print(f"  [stdout] {result.stdout.strip()}")

# 6. 主分支
print("\n[6/6] 设置主分支...")
git("branch", "-M", "main")
print("  OK")

# 7. 显示远程仓库状态
print("\n" + "=" * 60)
print("  本地仓库已准备完成！")
print("=" * 60)

remotes = git("remote", "-v")
if remotes:
    print(f"\n  远程仓库:\n  {remotes.replace(chr(10), chr(10)+'  ')}")
    print("\n  直接执行推送:")
    print('    git push -u origin main')
else:
    print("""
  接下来请完成以下步骤：

  【第一步】创建 GitHub 仓库
  1. 打开 https://github.com/new
  2. 仓库名填: erp-system
  3. 选择 Public（免费）
  4. 不要勾选任何初始化选项
  5. 点击 "Create repository"

  【第二步】推送代码
  创建后会看到一个页面，里面有推送命令，类似：
    git remote add origin https://github.com/你的用户名/erp-system.git
    git branch -M main
    git push -u origin main

  你可以在 PowerShell 中逐行执行这三条命令。

  注意：推送时会要求输入 GitHub 用户名和 Token（不是密码）
  Token 获取地址: https://github.com/settings/tokens
  勾选 repo 权限即可生成。
""")

print("\n当前分支:", git("branch", "--show-current"))
print("最近提交:", git("log", "--oneline", "-3"))
