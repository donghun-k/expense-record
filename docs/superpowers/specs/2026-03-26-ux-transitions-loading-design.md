# UX 트랜지션 & 로딩 오버레이 디자인 스펙

## 개요

지출 기록 앱 전반에 부드러운 트랜지션과 전역 로딩 오버레이를 적용하여 UX를 개선한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 트랜지션 수준 | 풍부함 (페이지 전환 + 리스트 stagger + 카드 등장 + 버튼 강화 + 숫자 카운트업 + 탭 슬라이드) |
| 애니메이션 라이브러리 | Framer Motion v11+ (`motion/react` 임포트) |
| 로딩 오버레이 범위 | Server Action → 전역 Dim + 스피너, 페이지 네비게이션 → 상단 프로그레스 바 |
| 스피너 스타일 | 도트 바운스 (3개 흰색 점 순차 바운스) |
| 페이지 전환 | Fade + Slide Up — 진입만 (App Router 제약으로 퇴장 애니메이션 없음) |
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
     └─ MotionConfig (reducedMotion: "user" — 전역 접근성 설정)
        └─ LazyMotion (features: domAnimation — 번들 최적화)
           └─ LoadingProvider (Context)
              └─ Nav (글래스모피즘 — PageTransition 밖, 항상 고정)
              └─ NavigationProgress (글로우 프로그레스 바)
              └─ LoadingOverlay (Dim + 도트 스피너)
              └─ main
                 └─ PageTransition (fade + slide-up, 진입만)
                    └─ {children}
```

### useTransition 전환 전략

기존 각 컴포넌트의 `useTransition` + `isPending` 패턴을 **제거**하고, `useLoadingAction()`으로 통합한다.

- 기존: `const [isPending, startTransition] = useTransition()` → `disabled={isPending}` + 텍스트 변경
- 변경: `const { execute, isPending } = useLoadingAction()` → 전역 오버레이 자동 표시 + 로컬 `isPending`도 반환하여 버튼 disabled 유지
- 이유: 전역 오버레이와 로컬 pending 상태가 중복되면 혼란스러우므로, 버튼 disabled는 유지하되 텍스트 변경("기록 중...")은 제거

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
  const [isPending, setIsPending] = useState(false)

  const execute = async (action: () => Promise<void>) => {
    setIsPending(true)
    showLoading()
    try { await action() }
    finally {
      hideLoading()
      setIsPending(false)
    }
  }
  return { execute, isPending }
}
```

기존 각 컴포넌트의 `useTransition` + `startTransition` 호출을 `execute()`로 교체한다.
`isPending`은 버튼 disabled 상태에만 사용하고, 텍스트 변경은 제거한다.

### 2. NavigationProgress

**동작**:
- 커스텀 `Link` 래퍼를 만들어 `onClick`에서 네비게이션 시작을 감지
- 클릭 시 → 프로그레스 바 시작 (0%→80%, 0.5s)
- `usePathname()` 변경 감지 → 완료 (80%→100% + fade out, 0.3s)
- 동일 pathname 클릭 시에는 프로그레스 바 미표시

**UI**:
- 화면 최상단 고정 (`position: fixed`, `top: 0`, `z-[60]`)
- 높이 3px, 흰색 바
- `box-shadow: 0 0 10px rgba(240, 147, 251, 0.8), 0 0 20px rgba(245, 87, 108, 0.4)` (핑크/퍼플 글로우)

### 3. PageTransition

**동작** (App Router 호환):
- `pathname` 변경 시 진입 애니메이션만 실행 (퇴장 없음 — App Router가 서버 컴포넌트를 즉시 교체하므로)
- `key={pathname}` + `motion.div`
- 진입: `opacity: 0, y: 20` → `opacity: 1, y: 0`
- duration: 0.3s, ease: `easeOut`
- `AnimatePresence` 없이 `motion.div`의 `initial` + `animate`만 사용

**Nav 위치**: PageTransition **밖**에 배치하여 페이지 전환 시 네비게이션 바가 깜빡이지 않도록 함.

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

**서버/클라이언트 경계**: `budget-status.tsx`는 현재 서버 컴포넌트이므로, AnimatedNumber를 사용하는 부분만 클라이언트 하위 컴포넌트(`BudgetStatusClient`)로 분리하거나, 전체를 `'use client'`로 전환한다. 서버에서 데이터를 fetch하는 로직이 없으므로(props로만 데이터 수신) 전체 클라이언트 전환이 더 간결하다.

### 7. 버튼 인터랙션 강화

**적용 대상**: `components/ui/button.tsx`

**구현** (Base UI 접근성 유지):
- `ButtonPrimitive` 유지 — `motion.button`으로 교체하지 않음
- CSS `transition: transform 0.15s` 추가
- `hover:scale-[1.02]` + `active:scale-[0.98]`
- 기존 `active:translate-y-px` 제거
- `transition: { type: "spring" }` 대신 CSS transition으로 구현하여 Base UI 호환성 유지

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

**데이터 동기화 전략**: 현재 expenses는 서버 컴포넌트에서 props로 전달됨. 퇴장 애니메이션을 위해 로컬 상태로 복사:
```typescript
const [localExpenses, setLocalExpenses] = useState(expenses)
useEffect(() => { setLocalExpenses(expenses) }, [expenses])

// 삭제 시: 로컬에서 먼저 제거 → AnimatePresence가 퇴장 처리
// Server Action 완료 → revalidatePath → props 갱신 → useEffect로 동기화
```

설정 페이지 항목(계좌, 카테고리)도 동일 패턴 적용.

## 접근성

- `MotionConfig`의 `reducedMotion: "user"` prop으로 전역 처리 — 개별 컴포넌트에서 `useReducedMotion()` 호출 불필요
- reduced motion 시 Framer Motion이 자동으로 애니메이션 즉시 완료
- CSS 버튼 애니메이션은 `@media (prefers-reduced-motion: reduce)` 쿼리로 별도 처리
- 로딩 오버레이의 Dim + 스피너는 유지 (기능적 요소)

## 신규 의존성

| 패키지 | 용도 | 임포트 경로 | 예상 번들 크기 |
|--------|------|-------------|---------------|
| `motion` (v11+) | 모든 애니메이션 | `motion/react` | ~20KB (gzipped, LazyMotion + domAnimation 사용 시) |

**번들 최적화**: `LazyMotion` + `domAnimation` feature set으로 필요한 기능만 로드. `domMax`는 사용하지 않음 (layout 애니메이션 미사용).

**SSR 호환성**: `motion/react`는 React 19 + Next.js App Router SSR을 기본 지원. `LazyMotion`의 `strict` 모드로 SSR 불일치 방지.

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | `motion` 의존성 추가 |
| `app/layout.tsx` | MotionConfig, LazyMotion, LoadingProvider, NavigationProgress, PageTransition 래핑 |
| `components/loading-provider.tsx` | 신규 — Context + LoadingOverlay + useLoadingAction 훅 |
| `components/navigation-progress.tsx` | 신규 — 글로우 프로그레스 바 + 커스텀 Link |
| `components/page-transition.tsx` | 신규 — 페이지 전환 래퍼 (진입 애니메이션만) |
| `components/animated-number.tsx` | 신규 — 숫자 카운트업 컴포넌트 |
| `components/ui/button.tsx` | CSS transition + scale 효과 추가 (Base UI 유지) |
| `components/expense-form.tsx` | useLoadingAction 적용, 카드 등장 애니메이션 |
| `components/expense-list.tsx` | 로컬 상태 복사 패턴, 리스트 stagger, 삭제 퇴장, useLoadingAction |
| `components/budget-status.tsx` | 'use client' 전환, AnimatedNumber 적용, 카드 등장 |
| `components/nav.tsx` | 커스텀 Link로 교체 (NavigationProgress 연동) |
| `components/month-selector.tsx` | 커스텀 Link로 교체 (NavigationProgress 연동) |
| `components/settings/account-settings.tsx` | 로컬 상태 복사, useLoadingAction, 리스트 stagger, 삭제 퇴장 |
| `components/settings/category-settings.tsx` | 로컬 상태 복사, useLoadingAction, 리스트 stagger, 삭제 퇴장 |
| `components/settings/budget-settings.tsx` | useLoadingAction, AnimatedNumber |
| `app/settings/page.tsx` | 탭 슬라이드 애니메이션 |

## 구현 순서

1. **의존성 설치 + 전역 설정**: motion 설치, layout.tsx에 MotionConfig + LazyMotion
2. **전역 로딩 인프라**: LoadingProvider + LoadingOverlay + useLoadingAction
3. **NavigationProgress**: 프로그레스 바 + 커스텀 Link
4. **PageTransition**: 페이지 전환 래퍼
5. **Button 강화**: CSS transition + scale
6. **ExpenseForm**: useLoadingAction 적용 + 카드 등장
7. **ExpenseList**: 로컬 상태 복사 + stagger + 삭제 퇴장 + useLoadingAction
8. **BudgetStatus**: 클라이언트 전환 + AnimatedNumber + 카드 등장
9. **Settings 컴포넌트**: 각 설정 페이지에 useLoadingAction + stagger + 삭제 퇴장
10. **탭 슬라이드**: 설정 페이지 탭 전환
11. **Dialog/Popover CSS 개선**: transition 통일
