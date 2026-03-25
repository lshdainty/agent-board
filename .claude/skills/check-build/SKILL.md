---
name: check-build
description: 프론트엔드 빌드를 실행하고 TypeScript 에러를 확인합니다.
---

# 빌드 확인 스킬

프론트엔드 프로젝트의 TypeScript 컴파일과 Vite 빌드를 검증합니다.

## 실행 절차

1. TypeScript 타입 체크 실행:
   ```bash
   cd /Users/lshdainty/study/agent-board/frontend && npx tsc --noEmit --pretty
   ```

2. 에러가 없으면 Vite 빌드:
   ```bash
   cd /Users/lshdainty/study/agent-board/frontend && npm run build
   ```

3. 결과 분석:
   - 타입 에러가 있으면 파일명, 라인, 에러 내용 보고
   - 빌드 에러가 있으면 상세 내용 보고
   - 모두 성공하면 "빌드 성공" 보고
