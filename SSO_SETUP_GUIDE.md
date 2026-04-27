# 다우오피스 SSO 설정 가이드

## 🎯 개요

다우오피스 그룹웨어에서 ItemMaster로 자동 로그인(SSO)을 구현하는 가이드입니다.

## 📋 필요 사항

1. **Firebase 프로젝트** (이미 구성됨)
2. **Vercel 계정** (무료) - Serverless 함수 배포용
3. **다우오피스 관리자 권한** - SSO 설정용

## 🔧 설정 단계

### 1단계: Firebase Admin SDK 설정

Firebase Console에서 서비스 계정 키를 생성합니다.

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 → **프로젝트 설정** → **서비스 계정** 탭
3. **새 비공개 키 생성** 클릭
4. JSON 파일 다운로드

다운로드된 JSON 파일에서 다음 정보를 확인:
```json
{
  "project_id": "your-project-id",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### 2단계: Vercel에 Serverless Function 배포

#### 2-1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2-2. Vercel 로그인
```bash
vercel login
```

#### 2-3. 프로젝트 배포
```bash
# 프로젝트 루트에서
vercel

# 프로덕션 배포
vercel --prod
```

#### 2-4. Vercel 환경 변수 설정

Vercel Dashboard에서 환경 변수 추가:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
DAOU_SSO_AES_KEY=다우오피스에서_설정한_16자리_키
```

⚠️ **주의**: `FIREBASE_PRIVATE_KEY`는 개행문자(`\n`)를 포함해야 합니다!

### 3단계: 프론트엔드 환경 변수 설정

`frontend/.env` 파일 생성:

```env
# Firebase (기존 설정)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# SSO API URL (Vercel 배포 후 URL)
VITE_SSO_API_URL=https://your-project.vercel.app/api/daou-sso
```

### 4단계: 다우오피스 SSO 설정

다우오피스 관리자 페이지에서:

1. **통합 로그인(SSO) 기능** 활성화
2. **연동 방식**: `쿠키` 또는 `파라미터` 선택
3. **연동 키**: `아이디` 선택
4. **암호화 방식**: `AES` 선택
5. **암호화 키**: 16자리 키 설정 (예: `SpeedRack123456`)
   - ⚠️ 이 키를 Vercel 환경 변수 `DAOU_SSO_AES_KEY`에 입력
6. **연동 URL**: 
   ```
   https://your-itemmaster-domain.com/sso-login?data={{암호화된데이터}}
   ```

### 5단계: 테스트

#### 로컬 테스트
```bash
cd frontend
npm run dev
```

#### SSO 테스트 URL
다우오피스에서 SSO를 통해 접근할 URL:
```
https://your-domain.com/sso-login?data=암호화된_사용자_정보
```

## 🔄 전체 흐름

```
┌─────────────────┐
│  다우오피스       │
│  (그룹웨어)      │
└────────┬────────┘
         │ 1. 사용자 클릭
         │ 2. 사용자 ID를 AES로 암호화
         │
         ▼
┌─────────────────────────────────┐
│  https://itemmaster.com          │
│  /sso-login?data=encrypted...    │
└────────┬────────────────────────┘
         │ 3. 암호화된 데이터 전달
         │
         ▼
┌─────────────────────────────────┐
│  Vercel Serverless Function      │
│  /api/daou-sso                   │
├─────────────────────────────────┤
│  1. AES 복호화                   │
│  2. Firebase Custom Token 생성  │
│  3. Token 반환                   │
└────────┬────────────────────────┘
         │ 4. Custom Token
         │
         ▼
┌─────────────────────────────────┐
│  ItemMaster Frontend             │
│  (Firebase Auth)                 │
├─────────────────────────────────┤
│  1. Custom Token으로 로그인     │
│  2. 사용자 세션 생성             │
│  3. 메인 페이지로 이동          │
└─────────────────────────────────┘
```

## 📝 다우오피스 SSO 설정 예시

이미지 기준으로:

- **사용여부**: `사용함`
- **연동 방식**: `쿠키` (또는 파라미터)
- **연동 키**: `아이디`
- **암호화 방식**: `AES`
- **암호화 방식**: 입력란에 16자리 키 입력
- **암호화 결과**: (테스트 버튼으로 확인)

## 🔒 보안 고려사항

1. ✅ **HTTPS 필수**: 프로덕션에서 반드시 HTTPS 사용
2. ✅ **암호화 키 보호**: 환경 변수로만 관리, 코드에 직접 입력 금지
3. ✅ **Token 만료 시간**: Firebase Custom Token은 1시간 유효
4. ✅ **CORS 설정**: Vercel Function에서 적절한 CORS 설정

## 🐛 문제 해결

### "Decryption failed" 오류
- 다우오피스에서 설정한 AES 키와 Vercel 환경 변수의 키가 일치하는지 확인

### "Firebase Custom Token" 오류
- Firebase Admin SDK 설정 확인
- Private Key가 올바르게 입력되었는지 확인 (`\n` 포함)

### 사용자가 생성되지 않음
- Firebase Authentication → Sign-in method에서 이메일/비밀번호 활성화 확인

## 📞 문의

문제가 발생하면 Vercel Functions 로그를 확인하세요:
```bash
vercel logs
```

## 🎉 완료!

설정이 완료되면 다우오피스에서 ItemMaster 링크를 클릭하면 자동으로 로그인됩니다!

