# Monochrome Glass — 디자인 시스템 리프레시 Spec

## Overview

기존의 코랄/핑크 그라데이션 + 글래스모피즘을 **무채색(neutral grayscale) 다크 핀테크** 무드로 전환하면서 글래스모피즘은 유지한다. 동시에 페이지·컴포넌트 전반의 일관성 격차를 해소한다. 데이터(숫자·상태)가 시각의 주인공이 되도록 색을 최대한 절제한다.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 무드 | Dark Fintech · Monochrome · Glass | 가계부 데이터 가독성·즉시성 ↑. 강한 그라데이션의 정보 가독성 부담 해소. |
| 모드 정책 | 다크 우선 + 차가운 그레이 라이트 미러 | 두 모드 모두 무채색 글래스. 시스템 설정을 따르되 톤 균일. |
| 컬러 | 중성 그레이 11단계 + 시그널 빨강·초록 각 2단계 | 그 외 색은 사용 금지. 시그널은 작은 면적(숫자·점·뱃지 테두리)에만, 한 화면 최대 3곳. |
| 글래스 강도 | 3단계 surface (subtle / default / elevated) | 단일 `--glass-bg`를 위계별로 분리. blur 16/20/24px. |
| 타이포 | Pretendard Variable (KR) + 시스템 숫자 + tabular-nums 전역 | 한국어 일관성 보장, 자릿수 정렬로 숫자 가독성. |
| 컨테이너 | `max-w-3xl` 전 페이지 통일 | 현재 2xl/4xl/기본 혼재 해소. |
| 헤더 | PageHeader 컴포넌트 (sub + h1 + actions) | 페이지별 헤더 패턴 일관성. |
| 삭제 확인 | AlertDialog 통일 | `window.confirm()` 모두 제거. |
| 모션 | motion/react 유지, duration 0.4 → 0.25s, easeOutExpo 통일 | 무드(핀테크)에 맞춰 더 절제된 모션. |
| 폰트 로딩 | `next/font` + 로컬 번들 | CDN 의존 X, layout shift 방지. |
| 비스코프 | 사이드바·대시보드형 홈·차트·신규 기능 | 이번엔 시각·일관성에만 집중. |

## Color Tokens

### Neutral grayscale (두 모드 공통 참조)

```css
--neutral-50:   #09090b;   /* 가장 어두움 */
--neutral-100:  #0c0c10;
--neutral-200:  #18181b;
--neutral-300:  #27272a;
--neutral-400:  #3f3f46;
--neutral-500:  #52525b;
--neutral-600:  #71717a;
--neutral-700:  #a1a1aa;
--neutral-800:  #d4d4d8;
--neutral-900:  #e4e4e7;
--neutral-950:  #f4f4f5;
--neutral-1000: #fafafa;   /* 가장 밝음 */
```

### Signal (양 모드 공통, 톤만 살짝 조정)

```css
/* dark */
--signal-pos:        #86efac;   /* 잔액·수입 */
--signal-pos-strong: #4ade80;
--signal-neg:        #fca5a5;   /* 초과·경고 */
--signal-neg-strong: #f87171;

/* light */
--signal-pos:        #15803d;
--signal-pos-strong: #166534;
--signal-neg:        #b91c1c;
--signal-neg-strong: #991b1b;
```

### Semantic mapping (다크)

```css
--background:        var(--neutral-50);    /* 단색, 그라데이션 제거 */
--foreground:        var(--neutral-1000);
--muted-foreground:  var(--neutral-600);
--border:            rgba(255,255,255,0.08);
--ring:              rgba(255,255,255,0.30);
--destructive:       var(--signal-neg);
```

### Semantic mapping (라이트)

```css
--background:        var(--neutral-1000);
--foreground:        var(--neutral-100);
--muted-foreground:  var(--neutral-500);
--border:            rgba(0,0,0,0.06);
--ring:              rgba(0,0,0,0.20);
--destructive:       var(--signal-neg);
```

## Glass surfaces (3단계)

| Token | Dark | Light | Blur | 용도 |
|---|---|---|---|---|
| `--surface-subtle` | `rgba(255,255,255,.03)` border `rgba(255,255,255,.06)` | `rgba(255,255,255,.40)` border `rgba(0,0,0,.04)` | 16px | 배경 패널, 입력 필드 |
| `--surface` | `rgba(255,255,255,.05)` border `rgba(255,255,255,.08)` | `rgba(255,255,255,.65)` border `rgba(0,0,0,.06)` | 20px | 카드 (기본) |
| `--surface-elevated` | `rgba(255,255,255,.08)` border `rgba(255,255,255,.12)` | `rgba(255,255,255,.85)` border `rgba(0,0,0,.08)` | 24px | 다이얼로그, 팝오버, nav |

기존 `--glass-bg / --glass-border / --glass-blur`는 위 토큰으로 대체하며 제거한다.

배경은 그라데이션을 제거하고 단색 `--background`로 변경. 글래스가 단색 위에서 더 정확하게 표현된다.

## Typography

- **폰트**: Pretendard Variable (한글) + 시스템 sans (라틴/숫자 폴백). `next/font/local` 또는 `@fontsource-variable/pretendard`로 자체 호스팅. Inter 제거.
- **전역**: `font-variant-numeric: tabular-nums` 적용 → 자릿수 정렬.
- **위계**:

| Token | Size | Weight | Letter-spacing | 용도 |
|---|---|---|---|---|
| `display` | 32px | 700 | -0.025em | 큰 금액 표시 (선택) |
| `h1` | 22px | 600 | -0.015em | 페이지 타이틀 |
| `h2` | 16px | 600 | 0 | 카드 타이틀, 섹션 헤더 |
| `body` | 14px | 400 | 0 | 본문 (기본) |
| `small` | 12px | 400 | 0 | 보조 텍스트, 캡션 |

## Radii · Spacing

- **`--radius`** 기준값 변경: 현재 `1rem` → `0.625rem`(10px). 파생 sm/md/lg/xl이 자동으로 절제됨.
  - `sm: 6 / md: 10 / lg: 14 / xl: 20 / 2xl: 26` (계산 공식은 유지)
- **Spacing**: Tailwind 기본 4px 그리드 유지. 카드 내부 패딩은 `p-4`(16px) 기준.

## Component System

### Button (`components/ui/button.tsx`)

variants 재정의:

| variant | 다크 | 라이트 | 비고 |
|---|---|---|---|
| `default` | `bg-neutral-1000 text-neutral-50` | `bg-neutral-100 text-neutral-1000` | 흰색/검정 솔리드. `primary` 컨셉 제거. |
| `outline` | `surface-subtle + border` | 동일 | 보조 액션. |
| `secondary` | 별칭 → `outline`과 통합 | — | variant 정리. |
| `ghost` | 투명, hover surface-subtle | 동일 | nav·인라인 액션. |
| `destructive` | `bg-[--signal-neg]/10 text-[--signal-neg] border-[--signal-neg]/20` (Tailwind v4 임의값) | 동일 | 텍스트·테두리만 컬러. globals.css에서 시그널 색을 `@theme`로 노출. |
| `link` | 유지 | 유지 | — |

sizes: `xs(24h, h-6)`, `sm(28h, h-7)`, `default(32h, h-8)`, `lg(38h, h-9)`, `icon` 계열 유지. hover `scale` 효과 제거(무드 부조화), 색상 변화만 유지.

### Card (`components/ui/card.tsx`)

- `surface` prop 추가: `'subtle' | 'default' | 'elevated'` (기본 `default`).
- 내부 배경/보더가 위 surface 토큰을 직접 참조.

### Input · Select · Textarea

- 36px 통일, surface-subtle 배경.
- focus: `box-shadow: 0 0 0 3px var(--ring)` + 보더 강조.
- error: 보더 `signal-neg`.

### DatePicker (신규: `components/ui/date-picker.tsx`)

- Popover + Calendar 조합을 단일 컴포넌트로 캡슐화.
- 시그니처: `<DatePicker value={Date} onChange={(d: Date) => void} placeholder?={string} disabled?={boolean} />`. 내부에서 `react-day-picker` `locale={ko}` 고정.
- `expense-form.tsx`·`expense-list.tsx`의 PopoverTrigger 하드코딩 제거.

### Badge (`components/ui/badge.tsx`)

variants 재명명 — 의미 기반:

| variant | 용도 |
|---|---|
| `default` | 중립 라벨 |
| `fixed` | 고정 지출 표시 |
| `ok` | 잔액 양호 (signal-pos) |
| `warn` | 초과·경고 (signal-neg) |

### AlertDialog

- 신규 사용처: 모든 `window.confirm()` 제거 대상.
  - `expense-list.tsx#handleDelete` ("이 지출 기록을 삭제하시겠습니까?")
  - 기타 confirm 호출 전수 조사 후 통합.
- 진행 중인 비동기 작업이 있을 때 ESC/외부 클릭으로 다이얼로그가 닫히지 않도록 막는 가드(`data-settings.tsx`에 이미 적용된 패턴)를 공통 hook(`useConfirmDialog` 또는 `<ConfirmDialog>` 래퍼)으로 추출.

### Calendar (react-day-picker)

- 셀 hover/selected/today 스타일을 위 토큰에 맞춰 재설정.
- selected: `bg-foreground text-background` (다크에선 흰색 솔리드).

## Page Patterns (신규 공용 컴포넌트)

### `components/page-header.tsx`

```tsx
<PageHeader
  caption="2026년 5월"
  title="지출 내역"
  actions={<MonthSelector ... />}
/>
```

- `caption(small, muted)` + `h1(22/600)` + `actions(우측)` 슬롯.
- 페이지 컨테이너 안에서 sticky 아님(스크롤됨).

### Container

- `app/layout.tsx`의 `<main>`을 `container mx-auto max-w-3xl px-4 py-6`로 통일.
- 각 페이지에서 별도 `max-w-*` 지정 금지. (예외 필요 시 prop으로 풀이)

### `components/ui/empty-state.tsx`

```tsx
<EmptyState
  icon={<Icon />}
  title="지출 기록이 없습니다"
  description="이번 달엔 아직 기록된 지출이 없어요."
  action={<Button>지출 입력하기</Button>}
/>
```

surface-subtle + dashed border.

### `components/ui/skeleton.tsx`

`animate-pulse` + `bg-foreground/5` 단순 박스. 페이지별 `<Suspense fallback={<PageSkeleton />}>` 패턴.

### Tabs (segmented look)

- `settings-tabs.tsx`의 Tabs를 segmented control 룩으로 (배경 surface-subtle, 활성 탭 surface).

## Page-level Application

### `/` 홈
- PageHeader: `caption="2026년 5월" title="지출 입력"`.
- ExpenseForm Card (surface=default).
- BudgetStatusCard (surface=default). 모바일에서 inline 정보가 줄바꿈되도록 `flex-wrap` + 작은 간격.

### `/history`
- PageHeader: `caption="{YYYY년} M월" title="지출 내역" actions={<MonthSelector />}`.
- 필터(계좌·카테고리)는 PageHeader 아래 inline 행으로 정리, 우측에 합계.
- Table 패딩 컴팩트, 빈 상태 → `<EmptyState>`.
- 삭제 → AlertDialog.

### `/settings`
- PageHeader: `caption="설정" title="계좌 · 카테고리 · 예산 관리"`.
- SettingsTabs를 segmented 룩으로.

## Motion

- 라이브러리 유지(motion/react).
- duration `0.4` → `0.25`, easing `[0.16, 1, 0.3, 1]`(easeOutExpo) 통일.
- 버튼 hover `scale` 제거. 색상 변화만.
- `prefers-reduced-motion`: 기존 가드 + staggerChildren·layout 비활성화.

## Toast (Sonner)

- 토스트 배경: surface-elevated.
- success: 무채색 + 작은 `signal-pos` 점.
- error: 무채색 + 작은 `signal-neg` 점. 배경 컬러 없음.
- position: bottom-center, duration 3500ms.

## Navigation

- `nav.tsx`: surface-elevated 적용(현재와 동일 글래스 강도).
- 활성 링크 컬러를 `--primary` 의존 → `text-foreground` + 비활성 `text-muted-foreground`로 변경.

## Navigation Progress

- 컬러를 다크 `bg-white` / 라이트 `bg-neutral-100`로.

## Accessibility

- 포커스 링: 모든 인터랙티브 요소 `focus-visible:ring-3 ring-ring`.
- 라이트 모드 글래스 위 텍스트 명도대비 4.5:1 보장.
- Dialog·AlertDialog·Popover: Base UI의 기본 focus trap·ESC·dismiss 동작 유지.

## Scope · 명시적 비스코프

**스코프 안**:
- `app/globals.css` 토큰 재정의 및 변수 통합.
- `components/ui/*` 전 컴포넌트 스타일 정제 (button, card, input, select, dialog, alert-dialog, calendar, badge, tabs, popover).
- 신규 컴포넌트: `date-picker.tsx`, `empty-state.tsx`, `skeleton.tsx`, `page-header.tsx`.
- `app/layout.tsx` 컨테이너 통일, 폰트 교체.
- 페이지(`app/page.tsx`·`app/history/page.tsx`·`app/settings/page.tsx`) PageHeader 적용 + Suspense + Skeleton.
- `expense-form.tsx`·`expense-list.tsx` DatePicker 사용으로 정리.
- `window.confirm()` 제거 → AlertDialog.
- `Toaster`·`navigation-progress` 톤 조정.

**비스코프**:
- 사이드바·대시보드형 홈 등 정보 구조 변경.
- 차트/그래프 추가.
- 새 기능 추가(예: 통계, 카테고리 컬러 지정 등).
- 새 의존성: Lucide 외 아이콘 라이브러리, 차트 라이브러리.
- 한국어 외 i18n.

## Migration / 적용 순서

큰 흐름은 다음 순서로 단계화한다:

1. **토큰**: globals.css 색·글래스·라디우스 토큰 재정의 + Pretendard 도입.
2. **Primitive**: button / card / input / select / badge / tabs / dialog / alert-dialog / popover / calendar 스타일 갱신.
3. **신규 공용 컴포넌트**: date-picker / empty-state / skeleton / page-header.
4. **레이아웃 통일**: app/layout.tsx 컨테이너·폰트.
5. **페이지 적용**: 홈·내역·설정 PageHeader·EmptyState·Skeleton·confirm 제거.
6. **모션/토스트/Nav 톤 조정 + 정리**.

각 단계 종료마다 build·lint·test(`npm test`) 통과를 확인한다.

## Risks & Mitigations

| 리스크 | 완화 |
|---|---|
| 글래스가 단색 배경에서 약해 보일 수 있음 | surface 알파/blur를 3단계로 분리, 가독성·위계가 명확. 단색 배경이라 글래스 자체가 더 또렷이 보이는 면도 있음. |
| 색을 거의 안 써서 단조롭게 느껴질 수 있음 | 타이포 위계·tabular 숫자·시그널 컬러의 정확한 사용으로 정보 밀도 자체가 표현이 됨. |
| 라이트 모드에서 글래스 위 텍스트 대비 부족 | surface 알파를 라이트에선 0.40~0.85로 충분히 높여 배경 영향 최소화. 텍스트 명도대비 4.5:1 검증. |
| Pretendard 추가로 번들 사이즈 증가 | Variable font 1개(약 110KB)만 로드. CDN 제거로 외부 의존 감소. |

## Out of scope decisions (이번에 결정 안 함)

- 카테고리별 컬러 지정 기능: 무채색 정책상 도입 안 함.
- 다크/라이트 토글 위치 변경: 현재 nav 우측 유지.
