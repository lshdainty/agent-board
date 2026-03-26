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
- **Frontend**: `npm run dev:front` (port 4001) — Vite HMR, 파일 수정 즉시 반영
- **Backend**: `npm run dev:api` (port 4000) — tsx watch 모드
- Frontend가 `/api`와 `/socket.io`를 localhost:4000으로 프록시

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

## 에이전트 상태 자동화 (필수)

### 등록된 에이전트 목록 (재활용 필수)
| ID | 이름 | 역할 |
|----|------|------|
| 20 | FrontDev | Frontend Developer |
| 21 | 3DDev | 3D Developer |
| 22 | BackDev | Backend Developer |

**새 에이전트를 DB에 추가하지 마라. 기존 에이전트를 재활용해라.**
새 역할이 필요하면 기존 에이전트의 role을 PATCH로 변경.

### 팀 리더(사람 또는 상위 에이전트)가 해야 할 일
에이전트를 spawn하기 **전에**:
1. 기존 에이전트 ID를 확인 (위 목록 참고)
2. 상태를 working으로 변경: `curl -s -X PATCH 'http://localhost:4000/api/agents/<ID>' -H 'Content-Type: application/json' -d '{"status":"working"}'`
3. 에이전트 prompt에 **반드시** 아래 내용 포함:
   - `당신의 DB agent_id는 <ID>입니다`
   - 상태 업데이트 curl 명령 (working/idle/offline)
   - 태스크 생성/완료 curl 명령

### 에이전트가 해야 할 일
1. **첫 번째 작업**: `curl -s -X PATCH 'http://localhost:4000/api/agents/<자기ID>' -H 'Content-Type: application/json' -d '{"status":"working","current_comment":"<첫 번째 작업 내용>"}'`
2. **파일 수정 전마다**: `curl -s -X PATCH 'http://localhost:4000/api/agents/<자기ID>' -H 'Content-Type: application/json' -d '{"current_comment":"<파일명> <작업 내용>"}'`
   - 예: `{"current_comment":"MemoEditorWidget.tsx 자동저장 구현"}`
   - 예: `{"current_comment":"agents.ts 입력 검증 추가"}`
3. **작업 완료 시**: `curl -s -X PATCH 'http://localhost:4000/api/agents/<자기ID>' -H 'Content-Type: application/json' -d '{"status":"idle","current_comment":null}'`
4. **종료 시**: `curl -s -X PATCH 'http://localhost:4000/api/agents/<자기ID>' -H 'Content-Type: application/json' -d '{"status":"offline","current_comment":null}'`
4. **태스크 생성**: `curl -s -X POST http://localhost:4000/api/tasks -H 'Content-Type: application/json' -d '{"project_id":1,"title":"<제목>","description":"<구체적인 작업 내용. 무엇을 왜 어떻게 했는지 상세히 적어라>","status":"todo","priority":"medium","assignee_id":<자기ID>}'`
   - 작업 시작 시: `curl -s -X PATCH 'http://localhost:4000/api/tasks/<id>' -d '{"status":"in_progress"}'`
   - **반드시 todo → in_progress → done 순서를 지켜라. 바로 done으로 넘기지 마라.**
   - **title**: 간결한 제목 (예: "OfficeScene 다크모드 수정")
   - **description**: 상세 설명 필수. 수정한 파일, 변경 내용, 이유를 적어라. 비워두지 마라.
5. **태스크 완료**: `curl -s -X PATCH 'http://localhost:4000/api/tasks/<task_id>' -H 'Content-Type: application/json' -d '{"status":"done"}'`

### 주의: 에이전트 보고 규칙
- **보고는 SendMessage로 1회만**. 같은 내용을 반복 보고하지 마라.
- 보고 후 추가 지시가 없으면 대기 상태로 전환.
- 종료 요청(shutdown_request)이 오면 즉시 승인하고 종료.

### 에이전트 spawn 시 prompt 작성 규칙 (필수)
- **"대기", "기다려", "wait" 같은 단어를 쓰지 마라** — 에이전트가 영원히 멈춤
- **메시지를 받으면 즉시 작업을 시작하도록** 명시해라
- **구체적인 파일 경로와 작업 내용**을 적어라 — 모호하면 에이전트가 안 움직임
- **기존 태스크 ID를 알려주고 in_progress로 변경하라고 지시해라** — 새 태스크를 만들지 않도록
- 예시 prompt 구조:
  ```
  1단계: 상태 working + 코멘트 설정 (curl 명령)
     curl PATCH agents/<ID> '{"status":"working","current_comment":"태스크 분석 시작"}'
  2단계: 태스크 #OOO를 in_progress로 변경 (curl 명령)
  3단계: 파일 수정 전 코멘트 변경 → 코드 수정 → 타입체크
     curl PATCH agents/<ID> '{"current_comment":"OfficeScene.tsx 다크모드 수정"}'
     // 파일 수정
     curl PATCH agents/<ID> '{"current_comment":"AgentNameLabel.tsx 라벨 개선"}'
     // 파일 수정
  4단계: 태스크 #OOO를 done으로 변경 (curl 명령)
  5단계: 상태 idle + 코멘트 초기화 + 보고 1회
     curl PATCH agents/<ID> '{"status":"idle","current_comment":null}'
  ```

### 에이전트 재지시 시 규칙
- 에이전트가 idle 상태인데 작업을 안 하면 SendMessage로 재지시
- 재지시 시에도 **구체적인 curl 명령과 파일 경로** 포함
- 2회 재지시해도 반응 없으면 에이전트 종료 후 새로 spawn

### 주의: 팀 에이전트의 구조적 한계
- in-process 에이전트는 `.claude/settings.json` 등 보호 파일 수정 시 권한 요청이 블록됨
- 권한 요청은 팀 리더가 승인해야 하므로, **보호 파일 수정은 팀 리더가 직접 처리**
- 에이전트는 `frontend/src/`, `packages/` 등 코드 파일만 수정하도록 제한

### 에이전트 먹통 원인 및 대응 (필수 숙지)

**원인 1: Bash 권한 블록**
- `bypassPermissions` 모드에서도 curl 등 Bash 명령이 권한 요청으로 블록될 수 있음
- 에이전트가 idle인데 태스크가 todo 그대로면 이 원인일 가능성 높음
- **대응**: 팀 리더가 에이전트 spawn 시 prompt에 curl 명령을 개별 Bash 호출이 아닌 연속 실행(&&)으로 묶어 요청 횟수를 줄이거나, 에이전트 종료 후 재spawn

**원인 2: "대기/wait" 키워드**
- prompt에 "대기", "기다려", "wait", "할당해줄 때까지" 같은 표현이 있으면 에이전트가 영구 정지
- **대응**: prompt에서 해당 표현 완전 제거. "즉시 시작", "이 prompt를 받은 즉시 실행" 명시

**원인 3: 메시지 수신 후 미반응**
- SendMessage로 추가 작업 지시해도 에이전트가 이전 컨텍스트에 묶여 새 메시지를 처리 못 함
- **대응**: 2회 재지시 후 무반응이면 종료 → 재spawn (새 에이전트는 깨끗한 컨텍스트)

### 팀 리더의 에이전트 상태 업데이트 의무 (반드시 지켜라)

**에이전트에게 작업을 시킬 때 팀 리더가 직접 해야 할 것:**
1. 작업 시작 전: `curl PATCH agents/<ID> '{"status":"working","current_comment":"<작업 내용>"}'` + `curl POST tasks (in_progress)`
2. 에이전트가 파일 수정할 때마다 `current_comment`를 갱신하도록 prompt에 명시
3. 작업 완료 후: `curl PATCH agents/<ID> '{"status":"idle","current_comment":null}'` + `curl PATCH tasks/<ID> done`
4. 이걸 빠뜨리면 대시보드에 상태가 반영 안 됨 — **절대 빠뜨리지 마라**

### 팀 리더의 에이전트 상태 모니터링 규칙

1. **에이전트 spawn 후 1분 이내에 태스크 상태 확인**
   ```bash
   curl -s 'http://localhost:4000/api/tasks?project_id=<ID>&limit=500' | python3 -c "..."
   ```
2. **태스크가 todo 그대로면 먹통 판정** → 즉시 재spawn
3. **에이전트가 idle인데 태스크가 in_progress면 정상** — 작업 중일 수 있음
4. **권한 요청(permission_request)이 오면 즉시 사용자에게 전달** — 블록 시간 최소화

## 작업 시 주의사항
- 파일 수정 후 PostEdit hook이 자동 타입체크 실행
- 에러가 있으면 즉시 수정
- 큰 변경 후에는 `/check-build` 스킬로 빌드 확인
- 시각적 변경 후에는 `/verify-preview` 스킬로 렌더링 확인
