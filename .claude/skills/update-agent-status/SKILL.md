---
name: update-agent-status
description: 에이전트의 상태를 DB에 업데이트합니다. 작업 시작 시 working, 완료 시 idle, 종료 시 offline으로 변경합니다.
---

# 에이전트 상태 업데이트 스킬

에이전트가 작업을 시작하거나 완료할 때 자동으로 DB 상태를 업데이트합니다.

## 사용법

```
/update-agent-status <agent_id> <status>
```

- agent_id: DB에 등록된 에이전트 ID (숫자)
- status: working | idle | offline

## 실행 절차

1. API 호출로 에이전트 상태 변경:
   ```bash
   curl -s -X PATCH http://localhost:3001/api/agents/<agent_id> \
     -H 'Content-Type: application/json' \
     -d '{"status": "<status>"}'
   ```

2. 활동 로그 기록:
   ```bash
   curl -s -X POST http://localhost:3001/api/activities \
     -H 'Content-Type: application/json' \
     -d '{"project_id": 1, "agent_id": <agent_id>, "action": "agent_status_changed", "message": "Agent status changed to <status>"}'
   ```

3. 결과 확인 후 보고

## 자동화 활용

에이전트가 팀 모드에서 작업 시작 시:
- 자기 agent_id로 `working` 상태 업데이트
- 작업 완료 시 `idle`로 변경
- 종료 시 `offline`으로 변경

이렇게 하면 대시보드에서 실시간으로 에이전트 상태가 3D 오피스에 반영됩니다.
