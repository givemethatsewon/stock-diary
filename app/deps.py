from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
from .database import get_db
from . import crud, models, schemas

load_dotenv()

# Firebase 초기화
def initialize_firebase():
    try:
        # 이미 초기화되었는지 확인
        firebase_admin.get_app()
        print("Firebase가 이미 초기화되어 있습니다.")
    except ValueError:
        # Firebase 서비스 계정 JSON 파일 경로
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        if not credentials_path:
            print("❌ GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다.")
            print("📝 .env 파일에 GOOGLE_APPLICATION_CREDENTIALS=./stock-diary-firebase-credentials.json를 추가하세요.")
            return False
            
        if not os.path.exists(credentials_path):
            print(f"❌ Firebase 서비스 계정 JSON 파일을 찾을 수 없습니다: {credentials_path}")
            print("📝 Firebase Console에서 서비스 계정 키를 다운로드하고 올바른 경로에 배치하세요.")
            return False
            
        try:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase가 성공적으로 초기화되었습니다.")
            return True
        except Exception as e:
            print(f"❌ Firebase 초기화 중 오류 발생: {e}")
            return False

# Firebase 초기화 실행
firebase_initialized = initialize_firebase()

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Firebase ID 토큰을 검증하고 해당 사용자를 반환합니다.
    사용자가 존재하지 않으면 새로 생성합니다.
    """
    if not firebase_initialized:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase가 초기화되지 않았습니다. 서버 설정을 확인해주세요."
        )
    
    try:
        # Firebase ID 토큰 검증
        decoded_token = auth.verify_id_token(credentials.credentials)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이메일 정보가 토큰에 포함되어 있지 않습니다."
            )
        
        # 데이터베이스에서 사용자 조회
        user = crud.get_user_by_firebase_uid(db, firebase_uid=firebase_uid)
        
        if not user:
            # 사용자가 존재하지 않으면 새로 생성
            user_create = schemas.UserCreate(firebase_uid=firebase_uid, email=email)
            user = crud.create_user(db, user=user_create)
        
        return user
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"인증에 실패했습니다: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) 