#!/usr/bin/env python3
"""
SQLite 데이터베이스 백업 스크립트
"""

import sqlite3
import shutil
import os
from datetime import datetime

def backup_database():
    """데이터베이스 백업"""
    db_path = "./stock_diary.db"
    backup_dir = "./backups"
    
    # 백업 디렉토리 생성
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # 백업 파일명 생성
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{backup_dir}/stock_diary_backup_{timestamp}.db"
    
    try:
        # 데이터베이스 파일 복사
        shutil.copy2(db_path, backup_path)
        print(f"데이터베이스 백업 완료: {backup_path}")
        
        # 오래된 백업 파일 정리 (30일 이상)
        cleanup_old_backups(backup_dir, days=30)
        
    except FileNotFoundError:
        print("데이터베이스 파일을 찾을 수 없습니다.")
    except Exception as e:
        print(f"백업 중 오류 발생: {e}")

def cleanup_old_backups(backup_dir, days=30):
    """오래된 백업 파일 정리"""
    import time
    current_time = time.time()
    cutoff_time = current_time - (days * 24 * 60 * 60)
    
    for filename in os.listdir(backup_dir):
        filepath = os.path.join(backup_dir, filename)
        if os.path.isfile(filepath) and filename.startswith("stock_diary_backup_"):
            if os.path.getmtime(filepath) < cutoff_time:
                os.remove(filepath)
                print(f"오래된 백업 파일 삭제: {filename}")

if __name__ == "__main__":
    backup_database() 