# -*- coding: utf-8 -*-
import git
import os
import sys

repo_dir = r"C:\Users\钟虎\Documents\erp-system"

print("=" * 60)
print("  ERP系统 - GitHub 上传助手")
print("=" * 60)

# 1. 初始化仓库
print("\n[1/6] 初始化 Git 仓库...")
try:
    repo = git.Repo.init(repo_dir)
    print("  OK")
except Exception as e:
    print(f"  错误: {e}")
    sys.exit(1)

# 2. 配置 git 用户信息（如果尚未配置）
print("\n[2/6] 配置 Git 用户信息...")
git_config = repo.config_reader()
try:
    existing_user = git_config.get_value("user", "name")
    print(f"  已有用户: {existing_user}")
except:
    print("  需要设置 GitHub 用户名和邮箱")
    github_username = input("  请输入你的 GitHub 用户名: ").strip()
    github_email = input("  请输入你的 GitHub 邮箱: ").strip()
    repo.config_writer().set_value("user", "name", github_username).release()
    repo.config_writer().set_value("user", "email", github_email).release()
    print("  OK")

# 3. 创建 .gitignore
print("\n[3/6] 检查 .gitignore...")
gitignore_path = os.path.join(repo_dir, ".gitignore")
if os.path.exists(gitignore_path):
    print("  已存在")
else:
    with open(gitignore_path, "w", encoding="utf-8") as f:
        f.write("node_modules/\nbuild/\n.env\n*.log\n.DS_Store\nThumbs.db\n.vscode/\n.idea/\n")
    print("  已创建")

# 4. 添加所有文件
print("\n[4/6] 添加文件到暂存区...")
repo.git.add(A=True)
print("  OK")

# 5. 提交
print("\n[5/6] 提交代码...")
try:
    repo.index.commit("feat: ERP系统 - 进销存+生产+财务全功能\n\n- 商品/供应商/客户基础数据管理\n- 入库单/销售出库单（含毛利自动计算）\n- 库存台账（安全库存预警）\n- 生产工单（领料出库、进度跟踪）\n- 财务管理（收支记录、净收益汇总）\n- 工作台仪表盘（关键指标卡片）\n- Docker Compose 一键部署\n- 预填6个月演示数据")
    print("  OK")
except Exception as e:
    print(f"  提交失败: {e}")
    sys.exit(1)

# 6. 提示创建远程仓库
print("\n[6/6] 准备推送到 GitHub")
print("")
print("=" * 60)
print("  接下来的操作步骤：")
print("=" * 60)
print("")
print("  1. 打开 https://github.com/new 创建新仓库")
print("     建议仓库名: erp-system")
print("     选择 Public（私有仓库需要付费）")
print("     不要勾选 'Add a README file'")
print("")
print("  2. 创建完成后，复制仓库地址（如）：")
print("     https://github.com/你的用户名/erp-system.git")
print("")
print("  3. 在下方粘贴仓库地址，按回车完成推送：")
print("")

repo_url = input("  GitHub 仓库地址: ").strip()
if not repo_url:
    print("  未输入地址，跳过推送。你可以稍后手动执行：")
    print(f'     cd "{repo_dir}"')
    print("     git remote add origin https://github.com/你的用户名/erp-system.git")
    print("     git branch -M main")
    print("     git push -u origin main")
    sys.exit(0)

# 添加远程仓库
print("\n  添加远程仓库...")
try:
    repo.create_remote("origin", repo_url)
    print("  OK")
except Exception as e:
    print(f"  远程仓库可能已存在: {e}")

# 推送
print("\n  推送到 GitHub（可能需要你输入用户名和Token）...")
print("  注意：GitHub 已不支持密码登录，请使用 Personal Access Token")
print("  获取 Token: https://github.com/settings/tokens")
print("")
try:
    repo.git.push("-u", "origin", "main")
    print("\n  ✅ 推送成功！")
    print(f"\n  仓库地址: {repo_url}")
except Exception as e:
    print(f"\n  推送失败: {e}")
    print("\n  请手动执行以下命令：")
    print(f'     cd "{repo_dir}"')
    print("     git branch -M main")
    print("     git push -u origin main")

print("\n" + "=" * 60)
