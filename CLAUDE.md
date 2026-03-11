# Linear CLI

Linear MCP 대신 로컬 CLI로 Claude Code의 컨텍스트 사용량을 줄이기 위한 도구.

## 기술 스택

- Runtime: Bun
- CLI 파싱: Commander.js
- API: @linear/sdk
- 빌드: `bun build src/index.ts --compile --outfile dist/linear` (단일 바이너리)
- 린트/포맷: `bun run lint`, `bun run format:check`

## 프로젝트 구조

```
src/
  index.ts              # 엔트리, 커맨드 라우팅
  commands/
    auth.ts             # auth login/logout
    issue.ts            # issue get/list/create/update
    comment.ts          # comment create
    team.ts             # team list
    label.ts            # label list
  lib/
    auth.ts             # API key 읽기/저장/삭제
    client.ts           # LinearClient 초기화
    resolver.ts         # 이름→UUID 변환 (team, state, assignee, labels, project)
    output.ts           # JSON 출력 (outputJSON, outputError)
    help.ts             # --help 메시지 정의
```

## 설계 원칙

- 모든 출력은 JSON (human-readable 출력 없음)
- 에러: `{"error": "message"}` + exit code 1
- 이름 기반 입력 → resolver가 내부적으로 UUID로 변환
- 식별자(TEAM-123) 형식 미지원, UUID만 사용

## 커맨드 요약

| 커맨드 | 설명 |
|--------|------|
| `linear auth login <api-key>` | API key 저장 |
| `linear auth logout` | 인증 삭제 |
| `linear issue get <id>` | 이슈 상세 (comments 포함) |
| `linear issue list [--team] [--assignee] [--state] [--limit]` | 이슈 목록 |
| `linear issue create --team <name> --title <text> [...]` | 이슈 생성 |
| `linear issue update <id> [--title] [--state] [...]` | 이슈 수정 |
| `linear comment create <issue-id> --body <text>` | 댓글 추가 |
| `linear team list` | 팀 목록 |
| `linear label list [--team <name>]` | 라벨 목록 |

## 진행 중인 논의

`docs/analysis-cli-for-ai-agents.md`에 Justin Poehnelt의 ["You Need to Rewrite Your CLI for AI Agents"](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/) 분석 결과가 있다. 이 프로젝트에 적용 가능한 개선 후보:

### 검토 중인 개선사항 (우선순위순)

1. **`--help --json` 스키마 인트로스펙션** — 에이전트가 help 텍스트를 파싱하지 않고 JSON 스키마로 정확한 커맨드를 생성할 수 있도록 지원
2. **`--dry-run` 플래그** — 쓰기 작업(create/update)에서 실제 API 호출 없이 입력 유효성 확인
3. **`--json` 입력 모드** — 플래그 대신 JSON body로 입력하여 shell escaping 문제 회피
4. **Exit code 세분화** — 에러 유형별 exit code 분리 (입력 에러/인증 에러/API 에러)

각 항목의 구체적인 분석과 우선순위 판단은 `docs/analysis-cli-for-ai-agents.md` 참조.

## 참고 문서

- `docs/specs/cli-poc-implementation.md` — 초기 설계 명세
- `docs/analysis-cli-for-ai-agents.md` — CLI for AI Agents 분석 및 시사점
