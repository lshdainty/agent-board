---
name: verify-preview
description: 프리뷰 서버를 시작하고 스크린샷을 찍어서 현재 3D 오피스 상태를 확인합니다.
---

# 프리뷰 검증 스킬

프론트엔드 개발 서버(agent-board-front)의 현재 렌더링 상태를 확인합니다.

## 실행 절차

1. `preview_start`로 `agent-board-front` 서버 시작 (이미 실행중이면 재사용됨)
2. `preview_screenshot`으로 현재 화면 캡처
3. 스크린샷을 분석하여:
   - 3D 오피스가 정상 렌더링되는지
   - 에이전트 캐릭터가 보이는지
   - UI 사이드바가 정상인지
   - 에러 메시지나 깨진 레이아웃이 없는지
4. 콘솔 에러 확인: `preview_console_logs(level: "error")`
5. 문제가 있으면 상세 내용과 함께 보고
