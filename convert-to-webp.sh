#!/bin/bash

# PNG/JPG画像をWebPに一括変換するスクリプト
# 既存のPNG/JPGファイルは残したまま、WebP版を追加

echo "WebP変換を開始します..."

# 変換されたファイルのカウンター
converted_count=0
skipped_count=0

# imagesフォルダ内のすべてのworks-フォルダを処理
for folder in images/works-*/; do
    echo ""
    echo "処理中: $folder"
    
    # PNGファイルを変換
    for file in "$folder"*.png; do
        if [ -f "$file" ]; then
            # WebP版のファイル名を生成
            webp_file="${file%.png}.webp"
            
            # WebPファイルが既に存在する場合はスキップ
            if [ -f "$webp_file" ]; then
                echo "  スキップ: $(basename "$webp_file") (既に存在)"
                ((skipped_count++))
            else
                echo "  変換中: $(basename "$file") -> $(basename "$webp_file")"
                cwebp -q 85 "$file" -o "$webp_file"
                ((converted_count++))
            fi
        fi
    done
    
    # JPGファイルを変換
    for file in "$folder"*.jpg; do
        if [ -f "$file" ]; then
            webp_file="${file%.jpg}.webp"
            
            if [ -f "$webp_file" ]; then
                echo "  スキップ: $(basename "$webp_file") (既に存在)"
                ((skipped_count++))
            else
                echo "  変換中: $(basename "$file") -> $(basename "$webp_file")"
                cwebp -q 85 "$file" -o "$webp_file"
                ((converted_count++))
            fi
        fi
    done
    
    # JPEGファイルを変換
    for file in "$folder"*.jpeg; do
        if [ -f "$file" ]; then
            webp_file="${file%.jpeg}.webp"
            
            if [ -f "$webp_file" ]; then
                echo "  スキップ: $(basename "$webp_file") (既に存在)"
                ((skipped_count++))
            else
                echo "  変換中: $(basename "$file") -> $(basename "$webp_file")"
                cwebp -q 85 "$file" -o "$webp_file"
                ((converted_count++))
            fi
        fi
    done
done

echo ""
echo "=========================================="
echo "変換完了！"
echo "新規変換: ${converted_count}件"
echo "スキップ: ${skipped_count}件"
echo "=========================================="

