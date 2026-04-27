# ItemMaster - 품목 및 BOM 관리 시스템

Firebase 기반의 제조업체용 품목 및 BOM 관리 시스템입니다.

## 🎯 주요 기능

- ✅ **품목 등록**: 제품, 반제품, 원자재, 부자재, 소모품 등록
- ✅ **BOM 수정**: Excel 기반 BOM 일괄 수정 및 이력 관리
- ✅ **다우오피스 SSO**: 그룹웨어 자동 로그인 연동
- ✅ **사용자 인증**: Firebase Authentication

---

## 🚀 빠른 시작

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

개발 서버: http://localhost:8080

### Firebase Cloud Functions 배포 (SSO 기능)

```bash
cd functions
npm install

firebase login
firebase functions:config:set daou.sso_key="A9xP3qL7vB2rT6mZ"
firebase deploy --only functions
```

상세 가이드: [QUICK_START.md](./QUICK_START.md)

---

## 📁 프로젝트 구조

```
ItemMaster/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx           # 일반 로그인
│   │   │   ├── SSOLogin.tsx        # SSO 자동 로그인
│   │   │   ├── ItemRegistration.tsx
│   │   │   ├── BomEdit.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   └── lib/
│   │       ├── firebase.ts         # Firebase Auth 설정
│   │       └── supabase.ts
│   └── firebase.json
│
├── functions/             # Firebase Cloud Functions
│   ├── index.js          # daouSSO Function (SSO 인증)
│   └── package.json
│
└── 문서/
    ├── QUICK_START.md              # 2분 빠른 시작
    ├── FIREBASE_SSO_SETUP.md       # SSO 상세 설정 가이드
    ├── SSO_SETUP_GUIDE.md          # 일반 SSO 개념 설명
    └── README_SSO_QUICK_START.md   # SSO 빠른 가이드
```

---

## 🔐 다우오피스 SSO 설정

### 1. Firebase Functions 배포

```bash
cd functions
npm install
firebase functions:config:set daou.sso_key="A9xP3qL7vB2rT6mZ"
firebase deploy --only functions
```

### 2. 다우오피스 관리자 설정

- **통합 로그인(SSO)**: 사용함
- **연동 방식**: 파라미터
- **연동 키**: 아이디
- **암호화 방식**: AES
- **암호화 키**: `A9xP3qL7vB2rT6mZ`
- **연동 URL**: `https://your-domain.com/sso-login?data={{암호화된데이터}}`

### 3. 동작 흐름

```
다우오피스 → 암호화된 사용자 정보 전달
    ↓
Firebase Cloud Function → 복호화 + Custom Token 생성
    ↓
ItemMaster → 자동 로그인 완료 ✅
```

**상세 가이드**: [FIREBASE_SSO_SETUP.md](./FIREBASE_SSO_SETUP.md)

---

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빌드 도구
- **TailwindCSS** + **shadcn/ui** - UI 컴포넌트
- **React Router** - 라우팅
- **Firebase Auth** - 사용자 인증
- **Supabase** - 데이터베이스 (선택적)

### Backend
- **Firebase Cloud Functions** - Serverless 함수
- **Firebase Authentication** - 사용자 관리
- **Firebase Admin SDK** - SSO Custom Token 생성

---

## 📝 환경 변수 설정

`frontend/.env` 파일 생성:

```env
# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Supabase (선택)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# SSO (선택 - 자동 생성됨)
VITE_FIREBASE_REGION=us-central1
```

---

## 🎨 주요 화면

### 로그인
- 일반 로그인: `/login`
- SSO 로그인: `/sso-login?data=...`

### 품목 관리
- 요청하기: `/items/request`
- 요청내역: `/items/history`

### BOM 관리
- 요청하기: `/bom/request`
- 요청내역: `/bom/history`

---

## 📚 문서

- [⚡ 빠른 시작 (2분)](./QUICK_START.md)
- [🔥 Firebase SSO 설정 가이드](./FIREBASE_SSO_SETUP.md)
- [📖 일반 SSO 개념](./SSO_SETUP_GUIDE.md)

---

## 🐛 문제 해결

### SSO 로그인이 안될 때

```bash
# Firebase Functions 로그 확인
firebase functions:log --only daouSSO

# 환경 변수 확인
firebase functions:config:get
```

### 로컬 개발 시 Functions 테스트

```bash
# Functions 에뮬레이터 실행
firebase emulators:start --only functions

# .env에 로컬 URL 설정
VITE_SSO_API_URL=http://localhost:5001/YOUR-PROJECT-ID/us-central1/daouSSO
```

---

## 📞 지원

Firebase Console → Functions → daouSSO → 로그에서 실행 상태를 확인할 수 있습니다.

---

## 📄 라이선스

MIT License
