import { useState, ChangeEvent } from 'react';
import { useApi } from '../hooks/use-api';

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const { getPresignedUrl, loading, error } = useApi();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // 파일 크기 검증 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      // 이미지 파일 타입 검증
      if (!selectedFile.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      setFile(selectedFile);
      setUploadedFileUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('먼저 파일을 선택해주세요.');
      return;
    }

    try {
      // 1. FastAPI 백엔드에 Presigned URL 요청
      const presignedData = await getPresignedUrl(file.name, file.type);
      
      if (!presignedData) {
        throw new Error('Presigned URL 요청에 실패했습니다.');
      }

      const { presigned_url } = presignedData;

      // 2. 발급받은 Presigned URL을 사용해 파일을 S3로 직접 PUT
      const uploadRes = await fetch(presigned_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
      }

      // 업로드된 파일의 최종 URL 계산
      const finalUrl = presigned_url.split('?')[0];
      setUploadedFileUrl(finalUrl);
      
      // 성공 메시지
      alert('이미지 업로드가 완료되었습니다!');

    } catch (error) {
      console.error('Upload error:', error);
      alert(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">이미지 업로드</h2>
      
      <div className="space-y-4">
        {/* 파일 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 파일 선택
          </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* 선택된 파일 정보 */}
        {file && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>파일명:</strong> {file.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>크기:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-sm text-gray-600">
              <strong>타입:</strong> {file.type}
            </p>
          </div>
        )}

        {/* 업로드 버튼 */}
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '업로드 중...' : '업로드 시작'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 업로드된 이미지 */}
        {uploadedFileUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">업로드 완료!</p>
            <div className="border rounded-md overflow-hidden">
              <img 
                src={uploadedFileUrl} 
                alt="업로드된 이미지" 
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
              {uploadedFileUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 