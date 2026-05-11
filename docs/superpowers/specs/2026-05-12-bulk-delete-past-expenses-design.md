# 지난 기간 지출 일괄 삭제 기능

작성일: 2026-05-12

## 배경

현재 지출 기록 앱은 매월 25일 ~ 익월 24일을 한 "기간"으로 정의하여 데이터를 관리한다. 사용자가 더 이상 필요 없는 과거 기간의 지출 기록을 한 번에 정리할 수 있는 수단이 없어, Notion 데이터베이스에 데이터가 무제한 누적된다. 본 기능은 **현재 기간 시작일 이전의 모든 지출 기록**을 일괄 삭제하는 인터페이스를 제공한다.

## 범위

### 포함
- 현재 기간 시작일 (예: 2026-05의 경우 `2026-05-25`) **이전** 날짜의 지출(Expense) 레코드 일괄 삭제
- 설정 페이지에 신규 "데이터" 탭 추가
- 삭제 전 건수 확인 → 사용자 확인 다이얼로그 → 실행 흐름

### 제외 (보존)
- 예산(Budget) 데이터 — 과거 기간 분석 히스토리 유지
- 계좌(Account), 카테고리(Category) — 시간 기반 데이터 아님
- 현재 기간 및 미래 날짜의 지출

## 데이터 모델

기존 모델 그대로 사용. 신규 스키마 변경 없음.
- `Expense.날짜`: `"YYYY-MM-DD"` (date 속성)
- 삭제 방식: 기존 패턴과 동일 — `notion.pages.update({ page_id, in_trash: true })` (휴지통 이동)

## 아키텍처

```
[설정 페이지: app/settings/page.tsx]
  └─ SettingsTabs (4개 탭으로 확장)
      ├─ 계좌
      ├─ 카테고리
      ├─ 예산
      └─ 데이터  ← 신규
          └─ DataSettings (신규 클라이언트 컴포넌트)
              ├─ "지난 기간 지출 삭제" 버튼 (variant="destructive")
              ├─ countPastExpenses() 호출 → AlertDialog 오픈
              └─ 확인 시 deletePastExpenses() 실행

[Server Actions: lib/actions/expense.ts] (기존 파일 확장)
  ├─ countPastExpenses(): Promise<number>
  └─ deletePastExpenses(): Promise<{ deletedCount: number }>
```

## 컴포넌트 / 함수 명세

### `lib/actions/expense.ts` 추가

#### `countPastExpenses(): Promise<number>`

- "현재 기간 시작일"을 서버에서 직접 도출: `getMonthDateRange(getCurrentYearMonth()).start`
- Notion 필터: `{ property: '날짜', date: { before: start } }`
  - `before`는 해당 날짜 *미포함*이므로 시작일 당일 데이터는 안전하게 보존됨
- 페이지네이션 처리: `page_size: 100`, `start_cursor`로 순회하며 누적 카운트
- 반환: 총 개수 (number)

#### `deletePastExpenses(): Promise<{ deletedCount: number }>`

- 동일 필터로 페이지 ID 전체 수집
- 직렬 처리: `for (const id of ids) await notion.pages.update({ page_id: id, in_trash: true })`
  - 병렬 처리는 Notion rate limit (3 req/s) 위험 → 직렬로 안전하게 진행
- 부분 실패 처리: try/catch로 진행 카운트(`deletedCount`) 보존, 실패 시 진행 카운트 포함된 에러 throw
- 성공/실패 모두 `revalidatePath('/')`, `revalidatePath('/history')` 호출
- 반환: `{ deletedCount: number }`

### `components/settings/data-settings.tsx` (신규)

- 'use client'
- 상태:
  - `open: boolean` — AlertDialog 표시 여부
  - `count: number | null` — 다이얼로그에 표시할 삭제 예정 건수
  - `useLoadingAction()` — 기존 패턴 재사용
- 동작:
  - 버튼 클릭 → `countPastExpenses()` 호출 → 결과를 `count`에 저장 → 다이얼로그 오픈
  - `count === 0`: "삭제할 지출 기록이 없습니다" 메시지 + 삭제 버튼 숨김
  - `count > 0`: "총 N건의 지출 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
  - 삭제 확인 → `deletePastExpenses()` → Sonner 토스트 (`${deletedCount}건 삭제됐습니다`) → 다이얼로그 닫기
  - 실패 시 toast.error
- UI 요소: Card (CardHeader/CardContent), Button (variant="destructive"), AlertDialog (신규 ui)

### `components/settings/settings-tabs.tsx` 수정

- `TAB_ORDER`에 `'data'` 추가: `['accounts', 'categories', 'budgets', 'data']`
- TabsList에 `<TabsTrigger value="data">데이터</TabsTrigger>` 추가
- 렌더 분기에 `{activeTab === 'data' && <DataSettings />}` 추가
- DataSettings는 props 불필요 (모든 데이터를 서버 액션 호출로 동적 조회)

### `components/ui/alert-dialog.tsx` (신규)

- shadcn/ui의 alert-dialog 컴포넌트 추가 필요
- 설치: `npx shadcn@latest add alert-dialog` (base-nova 스타일)
- 의존성: `@radix-ui/react-alert-dialog`

## 데이터 흐름

```
[사용자]
  │ 1. 설정 → 데이터 탭 → "지난 기간 지출 삭제" 클릭
  ▼
[DataSettings] handleOpenDialog()
  │ 2. execute(() => countPastExpenses())
  ▼
[Server: countPastExpenses]
  │ 3. getCurrentYearMonth() → '2026-05'
  │ 4. getMonthDateRange('2026-05').start → '2026-05-25'
  │ 5. notion.databases.query (date.before: '2026-05-25', 페이지네이션)
  │ 6. count 반환
  ▼
[DataSettings]
  │ 7. setCount(N), setOpen(true)
  ▼
[AlertDialog 표시: "N건 삭제됩니다"]
  │ 8. 사용자가 "삭제" 클릭
  ▼
[DataSettings] handleConfirmDelete()
  │ 9. execute(() => deletePastExpenses())
  ▼
[Server: deletePastExpenses]
  │ 10. 동일 쿼리로 ID 수집
  │ 11. 각 페이지에 in_trash: true (직렬)
  │ 12. revalidatePath('/'), revalidatePath('/history')
  │ 13. { deletedCount } 반환
  ▼
[DataSettings]
  │ 14. toast.success(`${deletedCount}건 삭제됐습니다`)
  │ 15. setOpen(false)
```

## 에러 처리

| 시점 | 처리 |
|---|---|
| `countPastExpenses()` 실패 | execute의 try/catch에서 잡고 toast.error → 다이얼로그 안 열림 |
| 페이지네이션 중 실패 | throw → 사용자에게 실패 알림. 부분 카운트 의미 없음 |
| 삭제 루프 중 실패 | 진행된 `deletedCount`까지 보존, `revalidatePath` 호출 후 에러 메시지에 카운트 포함하여 throw → toast.error로 사용자에게 알림 |
| 빈 상태 (count === 0) | 다이얼로그는 표시하되 "삭제할 항목 없음" 메시지 + 삭제 버튼 숨김 |
| 동시성 (다이얼로그 중 데이터 변경) | 무시 (1인 사용 도구). 실제 삭제 카운트로 정확한 토스트 표시 |

## 안전성 검증

- ✅ 시작일 당일 데이터 보존: `date.before` 필터는 해당 날짜를 포함하지 않음
- ✅ 미래 날짜 데이터 보존: 시작일 이전만 대상
- ✅ 다른 데이터 테이블 영향 없음: 지출 DB 페이지만 수정
- ✅ 카테고리/계좌가 삭제될 지출만 참조하더라도, 카테고리/계좌 자체는 그대로 유지됨 (참조 무결성 위배 없음, Notion relation은 일방향 참조)
- ✅ 사용자 클라이언트가 yearMonth를 조작하여 미래 데이터 삭제 시도 불가 (서버에서 직접 도출)

## 테스트 전략

### 자동 테스트
- 신규 단위 테스트는 추가하지 않음
  - Server Action은 Notion SDK 직접 호출이라 모킹 비용 대비 가치 낮음
  - 컴포넌트 테스트 인프라 (RTL) 미설정 — 기존 패턴 따름
  - `getMonthDateRange`는 기존 테스트에서 검증됨 (가정)

### 수동 QA 체크리스트
1. **빈 상태**: 과거 데이터 없을 때 "삭제할 지출 기록이 없습니다" 표시, 삭제 버튼 숨김
2. **정상 케이스**: 과거 N건 + 현재 M건 → 다이얼로그 "N건" 표시 → 삭제 후 토스트 "N건 삭제됨", 현재 M건 유지
3. **경계 검증**: 시작일 당일 (예: `2026-05-25`) 지출이 삭제되지 *않는지* 확인
4. **페이지네이션**: 100건 초과 데이터에서도 모두 카운트/삭제되는지 확인
5. **취소**: 다이얼로그 취소 시 데이터 변경 없음
6. **revalidate**: 삭제 후 `/`와 `/history` 새로고침 없이 갱신 확인
7. **예산 보존**: 삭제 후 예산 탭에서 과거 기간 예산 데이터 유지 확인 (예산은 별도 DB)

## 변경 파일 목록

| 파일 | 변경 |
|---|---|
| `lib/actions/expense.ts` | `countPastExpenses`, `deletePastExpenses` 추가 |
| `components/settings/data-settings.tsx` | 신규 |
| `components/settings/settings-tabs.tsx` | TAB_ORDER 확장, 렌더 분기 추가 |
| `components/ui/alert-dialog.tsx` | shadcn 추가 (`npx shadcn@latest add alert-dialog`) |
| `package.json` / lockfile | `@radix-ui/react-alert-dialog` 의존성 추가 |
