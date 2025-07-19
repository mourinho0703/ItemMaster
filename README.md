# ItemMaster - 아이템 및 BOM 관리 시스템

Django REST Framework 백엔드와 React 프론트엔드로 구성된 아이템 및 BOM(자재 명세서) 관리 시스템입니다.

## 프로젝트 구조

```
ItemMaster/
├── backend/                 # Django 백엔드
│   ├── itemmaster/         # Django 프로젝트 설정
│   ├── items/              # 아이템 관리 앱
│   ├── bom/                # BOM 관리 앱
│   ├── venv/               # Python 가상환경
│   ├── manage.py
│   └── requirements.txt
├── frontend/               # React 프론트엔드
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 기능

### 백엔드 (Django REST Framework)
- **아이템 관리**: 제품, 부품, 원자재 등의 아이템 정보 관리
- **카테고리 관리**: 아이템 분류를 위한 카테고리 시스템
- **공급업체 관리**: 아이템 공급업체 정보 및 관계 관리
- **BOM 관리**: 자재 명세서 작성, 버전 관리, 승인 프로세스
- **BOM 검증**: 구조, 비용, 가용성 등 다양한 검증 기능
- **변경 이력**: 모든 변경사항에 대한 추적 및 기록

### 프론트엔드 (React + TypeScript)
- 현대적인 UI/UX (Tailwind CSS + shadcn/ui)
- 아이템 등록 및 관리
- BOM 등록 및 검증
- 반응형 디자인

## 개발 환경 설정

### 백엔드 실행

```bash
cd backend

# 가상환경 활성화 (Windows)
.\venv\Scripts\Activate.ps1

# 개발 서버 실행
python manage.py runserver
```

백엔드 서버: http://localhost:8000
관리자 페이지: http://localhost:8000/admin

### 프론트엔드 실행

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드 서버: http://localhost:5173

## API 엔드포인트

- `/admin/` - Django 관리자 페이지
- `/api/` - REST API 기본 엔드포인트
- `/api-auth/` - DRF 인증 페이지

## 데이터베이스 모델

### Items 앱
- **Category**: 아이템 카테고리
- **Item**: 아이템 기본 정보
- **Supplier**: 공급업체 정보
- **ItemSupplier**: 아이템-공급업체 관계

### BOM 앱
- **BOM**: BOM 헤더 정보
- **BOMComponent**: BOM 구성품
- **BOMValidation**: BOM 검증 기록
- **BOMChangeHistory**: BOM 변경 이력

## 기술 스택

### 백엔드
- Python 3.11+
- Django 5.0.3
- Django REST Framework 3.14.0
- SQLite (개발용)

### 프론트엔드
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## 라이센스

MIT License
