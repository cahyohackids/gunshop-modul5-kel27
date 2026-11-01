#!/bin/bash
# Modul 5 Prak PPB — PWA II (Kelompok 27)
# Jalankan dari folder project:  bash deploy-mac.sh
set -e
REPO_NAME="gunshop-modul5-kel27"

echo "==> 1/4 Install dependencies"
npm install

echo "==> 2/4 Build production (cek PWA)"
npm run build

echo "==> 3/4 Push ke GitHub (repo baru: $REPO_NAME)"
if command -v gh >/dev/null 2>&1; then
  gh auth status >/dev/null 2>&1 || gh auth login
  if git remote get-url origin >/dev/null 2>&1; then
    git push -u origin main
  else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi
else
  echo "gh CLI belum ada. Bikin repo kosong '$REPO_NAME' di github.com/new, lalu jalankan:"
  echo "  git remote add origin https://github.com/<username>/$REPO_NAME.git"
  echo "  git push -u origin main"
  echo "Setelah itu jalankan lagi script ini atau lanjut import di vercel.com/new"
  exit 0
fi

echo "==> 4/4 Deploy ke Vercel"
echo "Opsi A (sesuai modul): buka https://vercel.com/new -> Import repo $REPO_NAME -> Deploy"
read -r -p "Mau deploy langsung lewat Vercel CLI sekarang? [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  npx --yes vercel@latest --prod
fi
echo "Selesai."
