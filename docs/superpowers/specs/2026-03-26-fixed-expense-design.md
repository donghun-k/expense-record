# 고정 지출 시스템 설계

## 개요

매월 고정으로 나가는 지출(월세, 보험, 구독 등)을 관리하는 시스템. 실제 지출로 등록하지 않고, 예산 현황에서 "고정 지출 예정 금액"으로 표시하여 남은 가용 예산을 파악하는 용도.

## 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 동작 방식 | 예산 반영형 — 실제 지출 등록 없이 예산 현황에만 표시 |
| 관리 단위 | 기존 계좌 내 전용 카테고리로 관리 |
| 구분 방식 | 카테고리 DB에 `고정여부` 체크박스 속성 추가 |
| 예산 현황 표시 | 일반 카테고리와 고정 지출 카테고리를 섹션 분리 |
| 지출 계산 | 예산 = 지출 (항상 잔여 0원, 잔여 표시 불필요) |
| 예산 설정 | 기존 예산 시스템 그대로 활용 (전월 복사 포함) |
| 지출 입력 폼 | 고정 지출 카테고리는 드롭다운에서 제외 |

## 데이터 모델 변경

### Notion 카테고리 DB 속성 추가

| 속성명 | 타입 | 설명 |
|--------|------|------|
| `고정여부` | checkbox | 고정 지출 카테고리 여부 |

기존 속성(`카테고리명`, `계좌`)은 변경 없음. 예산/지출 DB도 변경 없음.

### TypeScript 타입 변경

```typescript
// lib/types.ts
interface Category {
  id: string
  name: string
  accountId: string
  isFixed: boolean  // 추가
}
```

## Server Actions 변경

### `lib/actions/category.ts`

- `getCategories()`: Notion에서 `고정여부` 체크박스 속성을 읽어 `isFixed` 필드에 매핑
- `createCategory(name, accountId, isFixed)`: `isFixed` 파라미터 추가, Notion 페이지 생성 시 `고정여부` 속성 설정
- `updateCategory(id, name, accountId, isFixed)`: `isFixed` 파라미터 추가, Notion 페이지 업데이트 시 `고정여부` 속성 설정

### 변경 없는 Actions

- `lib/actions/expense.ts` — 변경 없음
- `lib/actions/budget.ts` — 변경 없음

## UI 변경

### 1. 예산 현황 (`components/budget-status.tsx`)

**현재:** 모든 카테고리를 계좌별로 그룹핑하여 동일하게 표시.

**변경 후:**
- `BudgetStatus[]`를 `isFixed` 기준으로 일반/고정으로 분리
- 일반 카테고리 섹션: 기존과 동일 (예산/사용/잔여 표시)
- 구분선
- 고정 지출 섹션: 계좌명 옆에 "고정 지출" 뱃지, 각 항목에 금액 + "고정" 뱃지 표시, 하단에 고정 지출 합계
- 양쪽 모두 계좌별 그룹핑 유지

**BudgetStatus 타입에 `isFixed` 추가:**

```typescript
interface BudgetStatus {
  categoryId: string
  categoryName: string
  accountId: string
  accountName: string
  budget: number
  spent: number
  remaining: number
  isOver: boolean
  isFixed: boolean  // 추가
}
```

**홈페이지(`app/page.tsx`)에서 BudgetStatus 생성 시:**
- 고정 지출 카테고리: `spent = budget`, `remaining = 0`, `isOver = false`, `isFixed = true`
- 일반 카테고리: 기존 로직 그대로, `isFixed = false`

### 2. 카테고리 설정 (`components/settings/category-settings.tsx`)

- 카테고리 생성/수정 폼에 "고정 지출" 체크박스 추가
- 카테고리 목록에서 `isFixed === true`인 항목에 "고정" 뱃지 표시

### 3. 지출 입력 폼 (`components/expense-form.tsx`)

- 카테고리 드롭다운에서 `isFixed === true`인 카테고리를 필터링하여 제외

### 4. 지출 내역 수정 (`components/expense-list.tsx`)

- 지출 수정 다이얼로그의 카테고리 드롭다운에서도 `isFixed === true`인 카테고리를 필터링하여 제외

### 5. 캐시 무효화 (`lib/actions/category.ts`)

- `createCategory`, `updateCategory`에서 `revalidatePath('/')` 추가 — 고정 여부 변경이 홈페이지의 예산 현황과 지출 입력 폼에 반영되도록

## 영향 범위

| 파일 | 변경 내용 |
|------|-----------|
| `lib/types.ts` | `Category`에 `isFixed` 추가, `BudgetStatus`에 `isFixed` 추가 |
| `lib/actions/category.ts` | CRUD에 `isFixed` 처리 추가 |
| `app/page.tsx` | BudgetStatus 생성 시 고정 지출 분기 처리 |
| `components/budget-status.tsx` | 일반/고정 분리 렌더링 |
| `components/settings/category-settings.tsx` | 고정 지출 체크박스 추가 |
| `components/expense-form.tsx` | 고정 카테고리 필터링 |
| `components/expense-list.tsx` | 수정 다이얼로그에서 고정 카테고리 필터링 |

## 변경하지 않는 것

- Notion 지출(Expense) DB
- Notion 예산(Budget) DB
- `lib/actions/expense.ts`
- `lib/actions/budget.ts`
- `lib/utils/budget.ts`

## 엣지 케이스

- **기존 카테고리를 고정으로 전환할 때**: 해당 카테고리에 이미 기록된 지출은 유지되지만, 이후 지출 입력 폼에서 해당 카테고리가 사라진다. 의도된 동작이며 별도 경고는 표시하지 않는다.
- **고정 지출 카테고리에 Notion에서 직접 지출 추가 시**: 예산 현황에서는 무시된다 (spent = budget으로 고정). 의도된 동작이다.
