# UX 트랜지션 & 로딩 오버레이 디자인 스펙

## 개요

지출 기록 앱 전반에 부드러운 트랜지션과 전역 로딩 오버레이를 적용하여 UX를 개선한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 트랜지션 수준 | 풍부함 (페이지 전환 + 리스트 stagger + 카드 등장 + 버튼 강화 + 숫자 카운트업 + 탭 슬라이드) |
| 애니메이션 라이브러리 | Framer Motion |
| 로딩 오버레이 범위 | Server Action → 전역 Dim + 스피너, 페이지 네비게이션 → 상단 프로그레스 바 |
| 스피너 스타일 | 도트 바운스 (3개 흰색 점 순차 바운스) |
| 페이지 전환 | Fade + Slide Up (opacity 0→1, y 20→0) |
| 프로그레스 바 | 글로우 바 (3px, 흰색 + 핑크/퍼플 글로우) |
| 아키텍처 | 하이브리드 — 전역 관심사는 Provider, 지역 관심사는 개별 컴포넌트 |

## 아키텍처

### 하이브리드 접근

- **전역 Provider**: 로딩 오버레이, 프로그레스 바, 페이지 전환
- **개별 컴포넌트**: 리스트 stagger, 카드 등장, 숫자 카운트업, 버튼 인터랙션, 탭 슬라이드, 삭제 퇴장

### 컴포넌트 트리

```
layout.tsx
  └─ ThemeProvider
     └─ LoadingProvider (Context)
        └─ NavigationProgress (글로우 프로그레스 바)
        └─ LoadingOverlay (Dim + 도트 스피너)
        └─ PageTransition (fade + slide-up)
           └─ {children}
```

## 전역 인프라 상세

### 1. LoadingProvider + LoadingOverlay

**Context API**:
- `LoadingContext`로 `showLoading()` / `hideLoading()` 전역 제공
- 내부 카운터 방식: 여러 동시 요청 시 모두 완료될 때까지 오버레이 유지

**LoadingOverlay UI**:
- 반투명 검정 Dim (`rgba(0,0,0,0.5)`) + `z-50`
- 도트 바운스 스피너 (3개 흰색 점, stagger delay 0.16s)
- `pointer-events: all`로 모든 클릭 차단
- `AnimatePresence`로 fade in/out (duration: 0.2s)

**커스텀 훅 `useLoadingAction()`**:
```typescript
function useLoadingAction() {
  const { showLoading, hideLoading } = useLoading()

  const execute = async (action: () => Promise<void>) => {
    showLoading()
    try { await action() }
    finally { hideLoading() }
  }
  return { execute }
}
```

기존 각 컴포넌트의 `startTransition` + Server Action 호출 부분을 `execute()`로 래핑.

### 2. NavigationProgress

**동작**:
- `usePathname()` 변화 감지
- 라우트 변경 시작 → 바 0%→80% (빠르게, 0.5s)
- 완료 시 → 100% + fade out (0.3s)

**UI**:
- 화면 최상단 고정 (`position: fixed`, `top: 0`, `z-[60]`)
- 높이 3px, 흰색 바
- `box-shadow: 0 0 10px rgba(240, 147, 251, 0.8), 0 0 20px rgba(245, 87, 108, 0.4)` (핑크/퍼플 글로우)

### 3. PageTransition

**동작**:
- `pathname`을 `key`로 사용하는 `AnimatePresence` + `motion.div`
- 진입: `opacity: 0, y: 20` → `opacity: 1, y: 0`
- 퇴장: `opacity: 0, y: -10` (빠르게)
- duration: 0.3s, ease: `easeOut`
- `mode: "wait"` (이전 페이지 퇴장 완료 후 새 페이지 진입)

## 개별 컴포넌트 애니메이션 상세

### 4. 리스트 아이템 Stagger 등장

**적용 대상**: `expense-list.tsx` 테이블 행, 설정 페이지 목록 아이템

**구현**:
- 부모 컨테이너: `motion.div` + `staggerChildren: 0.05`
- 각 행: `motion.tr` + `initial={{ opacity: 0, y: 10 }}` → `animate={{ opacity: 1, y: 0 }}`
- 초기 로드 및 필터 변경 시 재실행

### 5. 카드/섹션 등장 애니메이션

**적용 대상**: ExpenseForm 카드, BudgetStatus 카드, 설정 탭 내용

**구현**:
- `motion.div` + `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- duration: 0.4s, ease: `easeOut`
- 여러 카드 stagger: 0.1s

### 6. 숫자 카운트업 애니메이션

**적용 대상**: 예산 현황 금액 표시 (사용 금액, 잔여 금액, 진행률)

**구현**:
- Framer Motion `useMotionValue` + `useTransform` + `animate`
- 0에서 목표 값까지 카운트업
- duration: 0.8s, ease: `easeOut`
- `toLocaleString()`으로 천 단위 구분자 유지
- 재사용 컴포넌트: `<AnimatedNumber value={amount} />`

### 7. 버튼 인터랙션 강화

**적용 대상**: `components/ui/button.tsx`

**구현**:
- `motion.button`으로 교체
- `whileHover={{ scale: 1.02 }}`
- `whileTap={{ scale: 0.98 }}`
- `transition: { type: "spring", stiffness: 400, damping: 17 }`
- 기존 `active:translate-y-px` 제거

### 8. 탭 전환 슬라이드

**적용 대상**: 설정 페이지 Tabs

**구현**:
- 탭 인덱스 추적으로 방향 결정 (이전 < 현재 → 우→좌, 이전 > 현재 → 좌→우)
- `AnimatePresence` + `custom` prop으로 방향 전달
- 진입: `x: direction * 100` → `x: 0`
- 퇴장: `x: direction * -100`
- duration: 0.3s

### 9. Dialog/Popover 강화

**적용 대상**: 지출 수정 Dialog, 날짜 선택 Popover

**구현**:
- 기존 shadcn `data-open/data-closed` 애니메이션 유지 (Framer Motion으로 교체 시 Radix 내부 동작과 충돌 위험)
- 대신 CSS transition duration을 200ms로 통일하고 ease를 개선
- 오버레이 dim fade 처리 개선

### 10. 삭제 시 퇴장 애니메이션

**적용 대상**: 지출 내역 행 삭제, 설정 항목 삭제

**구현**:
- `AnimatePresence`로 감싸기
- 퇴장: `opacity: 0, x: -20, height: 0` (marginBottom도 0으로)
- duration: 0.3s
- 삭제 성공 후 로컬 상태에서 먼저 제거 → 애니메이션 → revalidation

## 접근성

- `prefers-reduced-motion: reduce` 미디어 쿼리 존중
- Framer Motion의 `useReducedMotion()` 훅 활용
- reduced motion 시 모든 애니메이션 즉시 완료 (duration: 0)
- 로딩 오버레이의 Dim + 스피너는 유지 (기능적 요소)

## 신규 의존성

| 패키지 | 용도 | 예상 번들 크기 |
|--------|------|---------------|
| `framer-motion` | 모든 애니메이션 | ~30KB (gzipped) |

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | framer-motion 의존성 추가 |
| `app/layout.tsx` | LoadingProvider, NavigationProgress, PageTransition 래핑 |
| `components/loading-provider.tsx` | 신규 — Context + LoadingOverlay + useLoadingAction 훅 |
| `components/navigation-progress.tsx` | 신규 — 글로우 프로그레스 바 |
| `components/page-transition.tsx` | 신규 — 페이지 전환 래퍼 |
| `components/animated-number.tsx` | 신규 — 숫자 카운트업 컴포넌트 |
| `components/ui/button.tsx` | motion.button으로 교체, spring 인터랙션 |
| `components/expense-form.tsx` | useLoadingAction 적용, 카드 등장 애니메이션 |
| `components/expense-list.tsx` | 리스트 stagger, 삭제 퇴장, useLoadingAction |
| `components/budget-status.tsx` | AnimatedNumber 적용, 카드 등장 |
| `components/month-selector.tsx` | 버튼 인터랙션 (motion 상속) |
| `components/settings/account-settings.tsx` | useLoadingAction, 리스트 stagger, 삭제 퇴장 |
| `components/settings/category-settings.tsx` | useLoadingAction, 리스트 stagger, 삭제 퇴장 |
| `components/settings/budget-settings.tsx` | useLoadingAction, AnimatedNumber |
| `app/settings/page.tsx` | 탭 슬라이드 애니메이션 |
