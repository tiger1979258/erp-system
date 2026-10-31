# -*- coding: utf-8 -*-
import subprocess
import os

repo_dir = r"C:\Users\钟虎\Documents\erp-system"
git_exe = r"C:\Users\钟虎\Documents\PortableGit\cmd\git.exe"

def git(*args):
    result = subprocess.run([git_exe] + list(args), cwd=repo_dir, capture_output=True, text=True, encoding='utf-8')
    return result.stdout.strip(), result.stderr.strip()

print("=" * 60)
print("  ERP系统 - 推送到 GitHub")
print("=" * 60)

# 检查是否有远程仓库
remotes_out, _ = git("remote", "-v")
if remotes_out:
    print(f"\n  已有远程仓库:\n  {remotes_out.replace(chr(10), chr(10)+'  ')}")
    print("\n  直接推送...")
    result = subprocess.run([git_exe, "push", "-u", "origin", "main"], cwd=repo_dir, capture_output=True, text=True, encoding='utf-8')
    if result.returncode == 0:
        print("  ✅ 推送成功！")
        print(f"\n  {result.stdout}")
    else:
        print(f"  ❌ 推送失败")
        print(f"  [stderr] {result.stderr}")
        print("\n  请检查：")
        print("  1. GitHub 仓库是否已创建")
        print("  2. 是否使用了 Personal Access Token 而非密码")
        print("  3. Token 是否有 repo 权限")
else:
    print("""
  请先在 GitHub 上创建仓库，然后提供仓库地址。

  快速创建:
  1. 打开 https://github.com/new
  2. 仓库名填: erp-system
  3. 选 Public，不要勾选初始化选项
  4. 点 "Create repository"
  5. 复制页面上的仓库 HTTPS 地址

  然后修改本脚本，将 repo_url 变量改为你的仓库地址，
  重新运行即可自动完成推送。
""")
    # 尝试读取用户输入的仓库地址
    repo_url = input("  请输入 GitHub 仓库地址 (直接回车跳过): ").strip()
    if not repo_url:
        print("\n  未输入地址，退出。")
        exit(0)

    print(f"\n  添加远程仓库: {repo_url}")
    _, err = git("remote", "add", "origin", repo_url)
    if err and "remote origin already exists" not in err:
        print(f"  错误: {err}")
        exit(1)
    print("  OK")

    print("\n  推送到 GitHub...")
    print("  注意：用户名是你的GitHub用户名")
    print("        密码请使用 Personal Access Token（不是登录密码）")
    print("  Token 获取: https://github.com/settings/tokens (勾选 repo 权限)")
    print()
    result = subprocess.run([git_exe, "push", "-u", "origin", "main"], cwd=repo_dir)
    if result.returncode == 0:
        print("\n  ✅ 推送成功！")
    else:
        print("\n  ❌ 推送失败，请检查错误信息")

print()
input("  按回车键退出...")
