# app/services/s3_service.py

import os
import boto3
import uuid
from app.config import settings



class S3Utils:
    def __init__(self):
        print(f"✅ S3 클라이언트 초기화: region={settings.AWS_S3_REGION}, bucket={settings.AWS_S3_BUCKET_NAME}")
        
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION,
            config=boto3.session.Config(
                signature_version='s3v4',  # AWS4-HMAC-SHA256 서명 사용
                region_name=settings.AWS_S3_REGION  # 리전을 명시적으로 설정
            )
        )
        self.bucket_name = settings.AWS_S3_BUCKET_NAME

    def get_presigned_url(self, filename: str, content_type: str = None):
        # Presigned URL 생성 로직
        unique_filename = f"etc/stock-diary/{uuid.uuid4()}-{filename}"
        
        # 기본 Content-Type 설정
        if not content_type:
            # 파일 확장자에 따른 기본 Content-Type
            if filename.lower().endswith(('.png')):
                content_type = 'image/png'
            elif filename.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif filename.lower().endswith(('.gif')):
                content_type = 'image/gif'  
            elif filename.lower().endswith(('.webp')):
                content_type = 'image/webp'
            else:
                content_type = 'image/jpeg'  # 기본값
        
        print(f"S3 Presigned URL 생성: filename={filename}, content_type={content_type}, key={unique_filename}, region={settings.AWS_S3_REGION}")
        
        presigned_url = self.s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': self.bucket_name, 
                'Key': unique_filename, 
                'ContentType': content_type
            },
            ExpiresIn=3600
        )
        
        print(f"생성된 Presigned URL: {presigned_url}")
        return presigned_url

# S3Service 인스턴스를 생성하여 다른 파일에서 가져다 쓸 수 있도록 함
s3_utils = S3Utils()