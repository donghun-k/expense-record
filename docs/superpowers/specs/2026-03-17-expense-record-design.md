# Expense Record — 설계 문서

**작성일**: 2026-03-17
**프로젝트**: expense-record
**목적**: Notion을 DB로 활용한 개인 지출 기록 웹 앱

---

## 개요

Next.js (App Router + Server Actions) + Notion API를 활용한 개인 지출 기록 앱.
인증 없이 혼자 사용하는 개인 도구이며, 카테고리별 월 예산 관리 및 잔여 예산 현황을 제공한다.

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js latest stable (App Router) |
| 서버 로직 | Server Actions |
| UI | Tailwind CSS + shadcn/ui |
| DB | Notion (공식 SDK: `@notionhq/client`) |
| 인증 | 없음 (개인 도구) |

---

## Notion DB 구조

### 1. 지출기록 DB

| 필드 | 타입 | 설명 |
|------|------|------|
| 사용처 | Title | 사용처/상점명 |
| 금액 | Number | 지출 금액 (원) |
| 날짜 | Date | 지출 날짜 |
| 계좌 | Relation → 계좌DB | 사용한 계좌 |
| 카테고리 | Relation → 카테고리DB | 지출 카테고리 |

### 2. 계좌 DB

| 필드 | 타입 |
|------|------|
| 계좌명 | Title |

### 3. 카테고리 DB

| 필드 | 타입 | 설명 |
|------|------|------|
| 카테고리명 | Title | |
| 계좌 | Relation → 계좌DB | 종속 계좌 |

### 4. 월별예산 DB

| 필드 | 타입 | 설명 |
|------|------|------|
| 이름 | Title | 예: "2026-03 식비" |
| 연월 | Rich Text | "YYYY-MM" 형식 |
| 예산금액 | Number | 해당 월 예산 (원) |
| 카테고리 | Relation → 카테고리DB | 해당 카테고리 |

---

## 앱 구조 (페이지)

### `/` — 메인 페이지
- **지출 입력 폼**
  - 날짜 (기본값: 오늘, 직접 선택 가능)
  - 금액
  - 사용처
  - 계좌 선택 (계좌DB에서 불러옴)
  - 카테고리 선택 (선택한 계좌에 종속된 카테고리만 표시)
- **이번 달 예산 현황**
  - 카테고리별 `예산 / 사용금액 / 잔여금액` 표시
  - 잔여금액 초과 시 빨간색 마이너스로 표시

### `/history` — 지출 내역
- 월별 필터로 지출 내역 조회
- 날짜, 사용처, 금액, 계좌, 카테고리 표시
- 각 항목 수정 (인라인 편집 또는 모달) 및 삭제 기능

### `/settings` — 설정
- **계좌 관리**: 계좌 추가/수정/삭제
  - 삭제 전 해당 계좌를 참조하는 카테고리/지출기록 존재 여부 확인
  - 참조 레코드 존재 시 삭제 차단 및 경고 표시
- **카테고리 관리**: 카테고리 추가/수정/삭제 (계좌 선택 포함)
  - 삭제 전 해당 카테고리를 참조하는 지출기록/예산 존재 여부 확인
  - 참조 레코드 존재 시 삭제 차단 및 경고 표시
- **예산 관리**: 월별 카테고리 예산 설정
  - 새 달 예산 없으면 전월 데이터를 기본값으로 자동 복사 제안

---

## 데이터 흐름

```
브라우저 → Server Action → Notion API → Notion DB
               ↑
        (NOTION_API_KEY는 서버 환경변수로만 관리, 클라이언트 노출 없음)
```

### 주요 흐름

| 동작 | 흐름 |
|------|------|
| 지출 입력 | 폼 제출 → Server Action → `pages.create()` → `revalidatePath('/')` → 예산 현황 갱신 |
| 지출 수정/삭제 | Server Action → `pages.update()` / `pages.update({ archived: true })` → `revalidatePath('/history')` + `revalidatePath('/')` |
| 예산 현황 | 서버 렌더링 시 이번 달 지출 + 예산 fetch → 카테고리별 계산 |
| 설정 변경 | Server Action → Notion DB 업데이트 → `revalidatePath` 호출 |
| 전월 예산 복사 | 해당 월 예산 없으면 전월 데이터 기반 자동 생성 제안 |

---

## 에러 처리

- Notion API 실패 → 사용자에게 toast 알림 (shadcn/ui `Sonner` 활용)
- 필수 입력값 누락 → 클라이언트 + 서버 양쪽 validation
- 계좌 선택 전 카테고리 선택 불가 (UI에서 비활성화)
- 계좌/카테고리 삭제 시 참조 레코드 존재하면 삭제 차단 (앱 레벨 참조 무결성)

---

## 디렉토리 구조 (예상)

```
expense-record/
├── app/
│   ├── layout.tsx            # 루트 레이아웃 (공통 Nav 포함)
│   ├── page.tsx              # 메인 (지출 입력 + 예산 현황)
│   ├── history/
│   │   └── page.tsx          # 지출 내역 (수정/삭제 포함)
│   └── settings/
│       └── page.tsx          # 설정
├── lib/
│   ├── notion.ts             # Notion 클라이언트 초기화 및 공통 유틸
│   └── actions/
│       ├── expense.ts        # 지출 관련 Server Actions (create, update, delete)
│       ├── account.ts        # 계좌 관련 Server Actions
│       ├── category.ts       # 카테고리 관련 Server Actions
│       └── budget.ts         # 예산 관련 Server Actions
├── components/
│   ├── nav.tsx               # 공통 네비게이션
│   ├── expense-form.tsx      # 지출 입력 폼
│   ├── budget-status.tsx     # 예산 현황 카드
│   ├── expense-list.tsx      # 지출 내역 테이블 (수정/삭제 UI 포함)
│   └── settings/
│       ├── account-settings.tsx
│       ├── category-settings.tsx
│       └── budget-settings.tsx
└── .env.local                # NOTION_API_KEY, DB ID들
```
