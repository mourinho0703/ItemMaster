# ItemMaster - Supabase 설정 가이드

## 📋 개요

ItemMaster는 Supabase를 사용하여 인증 및 데이터베이스 관리를 합니다.

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. 새 프로젝트 생성
3. 프로젝트 설정에서 API 키 확인

### 2. 환경 변수 설정

`frontend/.env` 파일을 생성하고 다음 내용을 추가:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**중요**: `.env` 파일은 Git에 커밋하지 마세요!

### 3. Supabase 데이터베이스 설정

#### 사용자 테이블 (auth.users)

Supabase는 자동으로 `auth.users` 테이블을 생성합니다.

#### 추가 테이블 생성 (필요 시)

Supabase SQL Editor에서 실행:

```sql
-- 예시: 사용자 프로필 테이블
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 활성화
alter table public.profiles enable row level security;

-- RLS 정책: 사용자는 자신의 프로필만 읽을 수 있음
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);
```

### 4. 사용자 생성

Supabase Dashboard → Authentication → Users에서 사용자를 수동으로 생성하거나,
회원가입 기능을 구현할 수 있습니다.

#### 수동 사용자 생성 (테스트용)

1. Supabase Dashboard → Authentication → Users
2. "Add user" 클릭
3. 이메일과 비밀번호 입력
4. "Create user" 클릭

## 🔐 SSO (Single Sign-On) 설정

### Supabase Edge Function 생성

SSO를 사용하려면 Supabase Edge Function을 생성해야 합니다.

#### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

#### 2. Supabase 프로젝트 초기화

```bash
cd supabase
supabase login
supabase init
```

#### 3. Edge Function 생성

```bash
supabase functions new daou-sso
```

#### 4. Edge Function 코드 작성

`supabase/functions/daou-sso/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { data: encryptedData } = await req.json()

    // TODO: 다우오피스 암호화 데이터 복호화
    // const decryptedEmail = decryptData(encryptedData)

    // Supabase Admin으로 사용자 확인/생성
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 사용자가 없으면 생성
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'user@example.com', // 복호화된 이메일
      password: 'temporary_password', // 임시 비밀번호
      email_confirm: true
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: user.email,
        password: 'temporary_password'
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

#### 5. Edge Function 배포

```bash
supabase functions deploy daou-sso
```

## 🛠️ 개발 환경 실행

```bash
cd frontend
npm install
npm run dev
```

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ 주의사항

1. **환경 변수**: `.env` 파일은 절대 Git에 커밋하지 마세요
2. **Anon Key**: 클라이언트에서 사용하는 Anon Key는 공개되어도 안전합니다 (RLS로 보호됨)
3. **Service Role Key**: Service Role Key는 서버(Edge Function)에서만 사용하고, 절대 클라이언트에 노출하지 마세요
4. **RLS 정책**: 모든 테이블에 적절한 RLS 정책을 설정하세요

## 🆘 문제 해결

### "Invalid API key" 오류

- `.env` 파일의 SUPABASE_URL과 SUPABASE_ANON_KEY가 올바른지 확인
- 개발 서버 재시작 (`npm run dev`)

### 로그인 실패

- Supabase Dashboard에서 사용자가 생성되었는지 확인
- 이메일 확인이 필요한 경우, Dashboard에서 수동으로 확인 처리

### SSO 실패

- Edge Function이 배포되었는지 확인
- Edge Function 로그 확인: `supabase functions logs daou-sso`

