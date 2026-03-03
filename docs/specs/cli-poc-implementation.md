# Linear CLI POC

## 목표

Claude Code 컨텍스트 사용량을 줄이기 위해 Linear MCP를 로컬 CLI로 대체

## 상세

### 기술 스택

- Runtime: Bun
- Linear SDK: `@linear/sdk`
- 빌드: `bun build --compile` (단일 바이너리)
- CLI 파싱: Commander.js

### 프로젝트 구조

```
src/
  index.ts          # entry point, 커맨드 라우팅
  commands/
    auth.ts         # auth login, auth logout
    issue.ts        # issue get, issue list, issue create, issue update
    comment.ts      # comment create
    team.ts         # team list
  lib/
    auth.ts         # API key 읽기/저장/삭제
    client.ts       # LinearClient 초기화
    resolver.ts     # 이름→UUID 변환 (team, state, assignee, labels, project)
    output.ts       # JSON 출력, 에러 출력
    help.ts         # --help 메시지 정의 및 출력
```

### 인증

- API Key 방식 (Personal API Key)
- `linear auth login <api-key>`: positional argument로 API key를 받아 로컬에 저장
- 저장 경로: `~/.linear-cli/credentials.json`
- 파일 형식: `{"apiKey": "lin_api_xxx"}`
- 디렉토리 없으면 자동 생성
- 우선순위: 환경변수 `LINEAR_API_KEY` > `~/.linear-cli/credentials.json`
- 추후 OAuth2로 전환 가능하도록 인증 로직 분리

### 사용 방법

```shell
linear <scope> <command> [options]
```

### ID 형식

- 모든 ID는 Linear UUID 형식 (Claude Code가 MCP에서 받는 형식과 동일)
- 식별자(`TEAM-123`) 형식은 지원하지 않음

### 옵션 값 규칙

- `--team`: 팀 이름 또는 key (내부에서 UUID로 변환)
- `--assignee`: `me` (현재 사용자) 또는 사용자 이름 (내부에서 UUID로 변환)
- `--state`: 상태 이름, 예: `"Done"`, `"In Progress"` (내부에서 UUID로 변환, team 컨텍스트 필요)
- `--priority`: 숫자 0-4 (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low)
- `--labels`: 쉼표 구분 문자열, 예: `"Bug,Enhancement"` (내부에서 UUID 배열로 변환)
- `--project`: 프로젝트 이름 (내부에서 UUID로 변환)

### 커맨드

#### auth

- `auth login <api-key>`: API key를 `~/.linear-cli/credentials.json`에 저장
  - 성공: `{"ok": true}`
- `auth logout`: 저장된 인증 정보 삭제
  - credentials 파일이 없어도 성공으로 처리
  - 성공: `{"ok": true}`

#### issue

- `issue get <id>`: 이슈 상세 조회
  - 출력 필드:
    - `id`, `identifier`, `title`, `description`, `url`
    - `state`: `{name, type}`
    - `assignee`: `{id, name}` (없으면 `null`)
    - `priority`: 숫자
    - `labels`: `[{id, name}]`
    - `branchName`: git branch name
    - `comments`: `[{id, body, author: {name}, createdAt}]`
- `issue list [options]`: 이슈 목록 조회
  - 필터: `--team`, `--assignee`, `--state`
  - 필터 없이 호출 가능 (전체 이슈 반환)
  - 고정 limit 50건, pagination 미지원
  - 출력: 이슈 배열, 각 항목은 `{id, identifier, title, state: {name, type}, assignee: {id, name}, priority, url}`
- `issue create [options]`: 이슈 생성
  - 필수: `--team`, `--title`
  - 선택: `--description`, `--assignee`, `--state`, `--priority`, `--labels`, `--project`
  - `--state` 사용 시 `--team` 값을 기반으로 state 조회
  - 성공: 생성된 이슈 정보 (`issue get`과 동일 구조, comments 제외)
- `issue update <id> [options]`: 이슈 수정
  - 변경 가능: `--title`, `--description`, `--state`, `--assignee`, `--priority`, `--labels`, `--project`
  - `--labels`는 기존 라벨을 교체 (append 아님)
  - `--state` 사용 시 이슈의 team을 기반으로 state 조회
  - 변경 옵션 없이 호출 시 에러
  - 성공: 수정된 이슈 정보 (`issue get`과 동일 구조, comments 제외)

#### comment

- `comment create <issue-id> --body <text>`: 이슈에 댓글 추가
  - 성공: `{id, body, author: {name}, createdAt}`

#### team

- `team list`: 팀 목록 조회
  - 출력: `[{id, name, key}]`

### Help 메시지

- `--help` 또는 `-h` 옵션으로 사용법 출력
- help 출력은 stdout, exit code 0
- help 출력은 plain text (JSON 아님)

#### `linear --help`

```
Usage: linear <command> [options]

Commands:
  auth     Manage authentication
  issue    Manage issues
  comment  Manage comments
  team     Manage teams

Run "linear <command> --help" for more information.
```

#### `linear auth --help`

```
Usage: linear auth <command>

Commands:
  login <api-key>   Save API key
  logout            Remove saved credentials
```

#### `linear issue --help`

```
Usage: linear issue <command> [options]

Commands:
  get <id>            Get issue details
  list [options]      List issues
  create [options]    Create an issue
  update <id> [options]  Update an issue

Issue Get:
  linear issue get <id>

Issue List:
  linear issue list [--team <name>] [--assignee <name>] [--state <name>]

Issue Create (required: --team, --title):
  linear issue create --team <name> --title <text> [--description <text>]
    [--assignee <name>] [--state <name>] [--priority <0-4>]
    [--labels <a,b>] [--project <name>]

Issue Update:
  linear issue update <id> [--title <text>] [--description <text>]
    [--state <name>] [--assignee <name>] [--priority <0-4>]
    [--labels <a,b>] [--project <name>]

Options:
  --team <name>        Team name or key
  --assignee <name>    "me" or user name
  --state <name>       State name (e.g., "Done", "In Progress")
  --priority <0-4>     0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --labels <a,b>       Comma-separated label names
  --project <name>     Project name
```

#### `linear comment --help`

```
Usage: linear comment <command>

Commands:
  create <issue-id> --body <text>   Add a comment to an issue
```

#### `linear team --help`

```
Usage: linear team <command>

Commands:
  list   List all teams
```

### 출력 형식

- 모든 성공 응답: 결과 객체를 직접 JSON 출력 (wrapper 없음)
- 에러 응답: `{"error": "<message>"}` + exit code 1
- JSON은 compact (indent 없음)

### 에러 처리

- API key 미설정: `{"error": "Not authenticated. Run: linear auth login <api-key>"}` + exit code 1
- 잘못된 ID, 네트워크 에러, API 에러: 모두 `{"error": "<message>"}` + exit code 1
- 잘못된 커맨드/옵션: `{"error": "Unknown command: <command>. Run \"linear --help\" for usage."}` + exit code 1
- 필수 옵션 누락: `{"error": "Missing required option: --<name>. Run \"linear <command> --help\" for usage."}` + exit code 1
- 에러는 top-level에서 catch하여 일관된 형식으로 출력
- Rate limiting, 인증 만료 등은 SDK 에러 메시지를 그대로 전달

## 경계

- ✅ 항상: JSON 출력, exit code로 성공/실패 구분
- ✅ 항상: 인증 로직을 별도 모듈로 분리
- ✅ 항상: 이름→UUID 변환을 resolver 모듈로 분리
- ⚠️ 먼저: 새로운 커맨드 추가 시 사용 빈도 검토
- 🚫 절대: OAuth 플로우 구현 (POC 범위 아님)
- 🚫 절대: Human-readable 출력 모드 (불필요)
- 🚫 절대: 테스트 코드 작성 (수동 검증으로 충분)
- 🚫 절대: Pagination 지원 (고정 limit으로 충분)
- 🚫 절대: 식별자(TEAM-123) 형식 ID 지원

## 검증

- 실제 Linear API로 수동 검증
- 각 커맨드별 동작 확인:
  - `linear auth login <api-key>` → credentials 파일 생성 확인
  - `linear auth logout` → credentials 파일 삭제 확인
  - `linear issue get <uuid>` → 이슈 정보 + comments + branchName JSON 출력 확인
  - `linear issue list --team <name> --assignee me` → 필터링된 목록 확인
  - `linear issue create --team <name> --title "test"` → 이슈 생성 확인
  - `linear issue update <uuid> --state "Done"` → 상태 변경 확인
  - `linear comment create <uuid> --body "test"` → 댓글 생성 확인
  - `linear team list` → 팀 목록 확인
  - 인증 없이 커맨드 실행 → 에러 JSON 확인
  - 잘못된 커맨드 → 에러 JSON 확인
