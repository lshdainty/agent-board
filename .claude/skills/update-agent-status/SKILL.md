---
name: update-agent-status
description: 에이전트 상태를 DB에 업데이트합니다. 3D 오피스 대시보드에 실시간 반영됩니다.
---

# 에이전트 상태 업데이트

## 사용법
```
/update-agent-status <agent_id> <working|idle|offline>
```

## 실행
```bash
curl -s -X PATCH "http://localhost:4000/api/agents/<agent_id>" \
  -H 'Content-Type: application/json' \
  -d '{"status": "<status>"}'
```

## 작업 코멘트 업데이트 (말풍선에 실시간 표시)
에이전트가 파일을 수정하기 **직전에** current_comment를 설정하면 3D 오피스 말풍선에 실시간으로 표시됩니다.
```bash
# 작업 시작 시 — 어떤 파일을 왜 수정하는지 적어라
curl -s -X PATCH "http://localhost:4000/api/agents/<agent_id>" \
  -H 'Content-Type: application/json' \
  -d '{"current_comment": "MemoEditorWidget.tsx 자동저장 구현"}'

# 다른 파일로 넘어갈 때 — 코멘트 변경
curl -s -X PATCH "http://localhost:4000/api/agents/<agent_id>" \
  -H 'Content-Type: application/json' \
  -d '{"current_comment": "TodoItem.tsx 완료 애니메이션 추가"}'

# 작업 완료 시 — 코멘트 초기화 (role로 돌아감)
curl -s -X PATCH "http://localhost:4000/api/agents/<agent_id>" \
  -H 'Content-Type: application/json' \
  -d '{"status":"idle","current_comment":null}'
```

## 에이전트 등록 (최초 1회)
```bash
curl -s -X POST http://localhost:4000/api/agents \
  -H 'Content-Type: application/json' \
  -d '{"project_id":1,"name":"<이름>","role":"<역할>","status":"working"}'
```
응답에서 `data.id`를 확인하여 이후 상태 업데이트에 사용.

## 태스크 생성
```bash
curl -s -X POST http://localhost:4000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"project_id":1,"title":"<작업내용>","status":"in_progress","priority":"medium","assignee_id":<agent_id>}'
```

## 태스크 완료
```bash
curl -s -X PATCH "http://localhost:4000/api/tasks/<task_id>" \
  -H 'Content-Type: application/json' \
  -d '{"status":"done"}'
```

## 에이전트 spawn 시 필수 규칙
1. spawn 전에 DB에 에이전트 등록 (POST) → agent_id 획득
2. 에이전트 prompt에 agent_id와 상태 업데이트 curl 명령 포함
3. 에이전트가 첫 작업으로 `curl PATCH working + current_comment` 실행
4. **파일 수정 전마다** `current_comment`를 해당 파일명+작업 내용으로 변경
5. 작업 완료 시 `curl PATCH idle + current_comment: null` 실행
6. 종료 시 `curl PATCH offline + current_comment: null` 실행
