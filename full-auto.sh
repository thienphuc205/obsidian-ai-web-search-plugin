#!/bin/bash

# 🚀 MASTER AUTOMATION SCRIPT
# Hoàn toàn tự động từ A-Z!

clear
echo "🤖 MASTER AUTOMATION - HOÀN TOÀN TỰ ĐỘNG"
echo "========================================"
echo ""
echo "🎯 Sẽ tự động thực hiện:"
echo "   1. ✅ GitHub Release Creation"
echo "   2. ✅ Obsidian Community Submission"
echo "   3. ✅ Pull Request Creation"
echo ""
echo "⏱️  Thời gian ước tính: 2-3 phút"
echo ""

read -p "🚀 Bắt đầu automation? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Đã hủy"
    exit 1
fi

echo ""
echo "🔥 BẮT ĐẦU AUTOMATION HOÀN TOÀN TỰ ĐỘNG!"
echo "=================================="

echo ""
echo "📍 BƯỚC 1/2: GITHUB RELEASE AUTOMATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./auto-release.sh

# Check if GitHub release was successful
if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ GitHub Release - THÀNH CÔNG!"
    echo ""
    echo "📍 BƯỚC 2/2: OBSIDIAN COMMUNITY SUBMISSION"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    sleep 2
    ./auto-obsidian-submit.sh
    
    if [[ $? -eq 0 ]]; then
        echo ""
        echo "🎉🎉🎉 HOÀN THÀNH HOÀN TOÀN TỰ ĐỘNG! 🎉🎉🎉"
        echo "================================================"
        echo ""
        echo "✅ GitHub Release: ĐÃ TẠO"
        echo "✅ Obsidian Submission: ĐÃ SUBMIT"
        echo "✅ Pull Request: ĐÃ TẠO"
        echo ""
        echo "🏆 PLUGIN CỦA BẠN ĐÃ ĐƯỢC SUBMIT HOÀN TOÀN TỰ ĐỘNG!"
        echo ""
        echo "📧 Bạn sẽ nhận notification khi Obsidian team review"
        echo "⏰ Thời gian review: 1-4 tuần"
        echo "🌟 Plugin sẽ sớm xuất hiện trong Obsidian Community!"
        echo ""
        echo "🎯 KHÔNG CẦN LÀM GÌ THÊM - TẤT CẢ ĐÃ HOÀN THÀNH!"
    else
        echo ""
        echo "⚠️  GitHub release OK, nhưng Obsidian submission có issue"
        echo "🔄 Thử manual: ./obsidian-submit.sh"
    fi
else
    echo ""
    echo "⚠️  GitHub release có issue"
    echo "🔄 Thử manual: ./simple-release.sh"
fi

echo ""
echo "📊 AUTOMATION SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Auto Scripts Available:"
echo "   • ./full-auto.sh         - Chạy tất cả tự động (script này)"
echo "   • ./auto-release.sh      - Chỉ GitHub release tự động"
echo "   • ./auto-obsidian-submit.sh - Chỉ Obsidian submission tự động"
echo ""
echo "📖 Manual Fallbacks:"
echo "   • ./simple-release.sh    - Manual GitHub release guide"
echo "   • ./obsidian-submit.sh   - Manual Obsidian submission guide"
