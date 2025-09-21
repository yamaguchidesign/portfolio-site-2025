#!/bin/bash
# 個別ページを一括更新するスクリプト

echo "Updating work pages from template..."

# テンプレートから個別ページを生成
cp work.html work1.html
cp work.html work2.html
cp work.html work3.html
cp work.html work4.html
cp work.html work5.html

echo "All work pages updated successfully!"
echo "Files updated: work1.html, work2.html, work3.html, work4.html, work5.html"
