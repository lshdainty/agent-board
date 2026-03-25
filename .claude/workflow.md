# Agent Board 개발 워크플로우

## 프로젝트 구조 (monorepo)
```
agent-board/
├── frontend/          # Vite + React 19 + Three.js (port 5173)
├── packages/
│   ├── api-server/    # Express + Socket.io (port 3001)
│   ├── mcp-server/    # MCP 서버
│   └── shared/        # 공유 타입
└── scripts/init-db.sql
```

## 개발 서버
- **Frontend**: `npm run dev:front` (port 5173) — Vite HMR, 파일 수정 즉시 반영
- **Backend**: `npm run dev:api` (port 3001) — tsx watch 모드
- Frontend가 `/api`와 `/socket.io`를 localhost:3001로 프록시

## 빌드 순서
1. `npm run build:shared`
2. `npm run build:api`
3. `npm run build:front`
- 또는 전체: `npm run build`

## 프론트엔드 핵심 디렉토리
- `src/components/office/` — 3D 오피스 컴포넌트 (Three.js / R3F)
- `src/components/sidebar/` — UI 사이드바 패널
- `src/components/` — 칸반보드, 태스크카드 등
- `src/hooks/` — React Query 훅, Socket.io, 상태 관리
- `src/types/index.ts` — 모든 타입 정의
- `src/constants/office.ts` — 3D 오피스 상수 (방 크기, 책상 위치 등)
- `src/lib/` — 유틸리티 (패스파인딩, 외형 결정 등)

## 테마 시스템
- CSS 변수: `:root` (라이트), `.dark` (다크) — `src/index.css`
- App.tsx에서 `document.documentElement.classList`로 `.dark` 토글
- **3D 컴포넌트는 Canvas 내부라 CSS 변수 직접 접근 불가**
  → `theme: 'light' | 'dark'` prop을 App → OfficeView → OfficeScene → OfficeLayout → 하위 컴포넌트로 전달

## 3D 컴포넌트 트리
```
OfficeView { projectId, theme }
  └── Canvas
        └── OfficeScene { agents, tasks, theme }
              └── OfficeLayout { agents, tasks, theme }
                    ├── OfficeWalls { theme }
                    ├── OfficeFloor { theme }
                    ├── Desk { position, rotation, theme }
                    ├── DeskPartition { position, width, theme }
                    ├── MeetingTable { position, chairCount, theme }
                    ├── Bookshelf { position, rotation, theme }
                    ├── CoffeeArea { position, theme }
                    ├── AgentCharacter { agent, position, appearance, theme, ... }
                    │     ├── AgentHair { style, color, opacity }
                    │     └── AgentNameLabel { name, role, status, taskTitle, theme }
                    ├── Plant { position }
                    └── Whiteboard { position, rotation }
```

## 데이터 흐름
- React Query로 API 호출: `useTasks`, `useAgents`, `useActivities`
- Socket.io로 실시간 업데이트: `useSocket` — 이벤트 수신 시 React Query 캐시 무효화
- 에이전트 선택: `useSelectedAgent` (React Context)
- 에이전트 위치: `useAgentPositions` (상태 기반 목표 위치 계산)

## 작업 시 주의사항
- 파일 수정 후 PostEdit hook이 자동 타입체크 실행
- 에러가 있으면 즉시 수정
- 큰 변경 후에는 `/check-build` 스킬로 빌드 확인
- 시각적 변경 후에는 `/verify-preview` 스킬로 렌더링 확인
