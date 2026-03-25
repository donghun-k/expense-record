# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Notion을 백엔드 데이터베이스로 사용하는 지출 기록 웹 애플리케이션. Next.js 16 App Router + React 19 + TypeScript 기반이며, 한국어 UI를 제공한다.

## 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행
npm test             # Jest 테스트 실행
npm run test:watch   # Jest 워치 모드
npx jest __tests__/utils/budget.test.ts  # 단일 테스트 파일 실행
```

## 아키텍처

### 데이터 흐름
- **API 라우트 없음** — 모든 데이터 조작은 Next.js Server Actions(`lib/actions/`)를 통해 수행
- **Notion API 직접 연동** — `@notionhq/client`로 Notion 데이터베이스에 CRUD 수행
- 서버 컴포넌트에서 데이터 조회 → 클라이언트 컴포넌트에 props 전달 → 클라이언트에서 Server Action 호출로 변경

### Notion 데이터베이스 구조
- **계좌(Account)**: `계좌명`(title)
- **카테고리(Category)**: `카테고리명`(title), `계좌`(relation)
- **지출(Expense)**: `사용처`(title), `금액`(number), `날짜`(date, "YYYY-MM-DD"), `계좌`(relation), `카테고리`(relation)
- **예산(Budget)**: `이름`(title), `연월`(rich_text, "YYYY-MM"), `예산금액`(number), `카테고리`(relation)

참조 무결성: 계좌/카테고리 삭제 시 참조 여부를 사전 검증한다.

### 페이지 구성
- `/` — 지출 입력 폼 + 예산 현황
- `/history` — 월별 지출 내역 조회/수정/삭제
- `/settings` — 계좌, 카테고리, 예산 관리

### UI 스택
- **shadcn/ui** (base-nova 스타일) + **Radix UI** + **Tailwind CSS v4**
- 토스트: Sonner, 아이콘: Lucide React
- 다크모드: next-themes
- 폼: React Hook Form + Zod 검증

## 주의사항

### 날짜 처리
JavaScript `Date` 생성자의 UTC 파싱 버그를 방지하기 위해 날짜 문자열을 수동 파싱하는 패턴을 사용한다. `new Date("YYYY-MM-DD")`는 UTC로 해석되므로 주의.

### 페이지 렌더링
실시간 데이터가 필요한 페이지에는 `export const dynamic = 'force-dynamic'`을 설정하여 캐시된 데이터 방지.

### 캐시 무효화
Server Action에서 데이터 변경 후 반드시 `revalidatePath()`를 호출하여 캐시 갱신.

## 환경변수

`.env.local`에 다음 값이 필요하다:
```
NOTION_API_KEY
NOTION_EXPENSE_DB_ID
NOTION_ACCOUNT_DB_ID
NOTION_CATEGORY_DB_ID
NOTION_BUDGET_DB_ID
```

## 경로 별칭

`@/*` → 프로젝트 루트 (`./`)
