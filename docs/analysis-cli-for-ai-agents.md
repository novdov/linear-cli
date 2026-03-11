# "You Need to Rewrite Your CLI for AI Agents" 분석 및 시사점

> 원문: https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/
> 저자: Justin Poehnelt (Google Senior DevRel)
> 분석일: 2026-03-11

## 글의 핵심 주장

Justin Poehnelt은 Google Workspace CLI(`gws`)를 만들면서 **"Agent DX(Developer Experience)는 Human DX와 근본적으로 다르다"**는 전제를 세운다.

- Human DX는 **발견 가능성(discoverability)**을 최적화한다.
- Agent DX는 **예측 가능성(predictability)**을 최적화한다.

CLI는 AI 에이전트가 외부 시스템에 접근하는 가장 마찰이 적은 인터페이스이며, 에이전트에게는 GUI가 아닌 결정론적이고 기계 판독 가능한 출력, 런타임에 조회 가능한 자기 기술적 스키마, 환각에 대한 안전장치가 필요하다.

## 6대 설계 원칙

| # | 원칙 | 설명 |
|---|------|------|
| 1 | **JSON-first 출력** | `--output json` 또는 NDJSON 기본 출력. 에이전트는 파싱 가능한 구조화된 데이터 필요 |
| 2 | **런타임 스키마 인트로스펙션** | `--describe` 또는 `--help --json`으로 파라미터 스키마를 JSON으로 반환. 에이전트가 docs 없이 정확한 호출 구성 가능 |
| 3 | **구조화된 JSON 입력** | 플래그 대신 JSON body 직접 입력 지원. 중첩 구조 표현에 유리, shell escaping 문제 회피 |
| 4 | **환각 방지 안전장치** | 입력 검증, 경로 트래버설 방지 등 에이전트 특유의 실수 패턴에 대한 방어 |
| 5 | **Agent Skills 문서** | 커맨드별 사용 패턴을 SKILL.md로 제공하여 에이전트가 구문을 "발명"하지 않도록 유도 |
| 6 | **NDJSON 페이지네이션 & Dry Run** | 스트림 처리 가능한 출력, `--dry-run`으로 부작용 없이 확인 |

## 현재 프로젝트(linear-cli)와의 비교

### 이미 잘하고 있는 것

1. **JSON-only 출력** — `src/lib/output.ts`에서 모든 출력이 `JSON.stringify`를 통과한다. 에러도 `{error: "..."}` 형식. Poehnelt이 가장 강조하는 원칙과 완벽히 부합.

2. **구조화된 에러 응답** — 에러를 JSON으로 반환하고 exit code 1을 사용한다. 에이전트가 에러를 파싱하고 대응할 수 있는 구조.

3. **Name resolution layer** — `src/lib/resolver.ts`가 사람 친화적 이름(팀명, 유저명)을 ID로 변환한다. 에이전트가 ID를 외울 필요 없이 자연어에 가까운 입력을 사용 가능.

4. **병렬 해석** — `Promise.all()`로 resolver들을 동시에 실행하여 지연시간을 최소화.

5. **MCP 대신 CLI 선택** — Poehnelt의 후속 글 "[The MCP Abstraction Tax](https://justin.poehnelt.com/posts/mcp-abstraction-tax/)"와 맥이 닿는 설계 결정.

### 개선 가능한 부분

#### 1. 런타임 스키마 인트로스펙션 (높은 우선순위)

현재 `--help`는 plain text를 출력한다. 에이전트 입장에서는 이를 파싱해야 한다.

**개선안:** `linear issue create --describe` 또는 `linear --help --json`

```json
{
  "command": "issue create",
  "required": {"--team": "string", "--title": "string"},
  "optional": {"--description": "string", "--priority": "0|1|2|3|4"},
  "examples": ["linear issue create --team 'Backend' --title 'Fix bug'"]
}
```

에이전트가 이 JSON 스키마를 보고 정확한 커맨드를 생성할 수 있어 help 텍스트 파싱보다 훨씬 신뢰성이 높다.

#### 2. Agent Skill 문서 — CLAUDE.md (높은 우선순위)

현재 프로젝트에는 `CLAUDE.md`나 에이전트용 사용 가이드가 없다. `gws`는 100개 이상의 `SKILL.md`를 제공하지만, 이 프로젝트 규모라면 하나의 `CLAUDE.md`에 전체 사용 패턴을 정리하면 충분하다.

#### 3. `--dry-run` 플래그 (중간 우선순위)

쓰기 작업(`issue create`, `issue update`, `comment create`)에서 `--dry-run` 플래그가 있으면 에이전트가 실제 API 호출 전에 입력 유효성을 확인할 수 있다. 에이전트가 잘못된 팀 이름이나 상태 값을 hallucinate할 수 있는 상황에서 유용.

#### 4. `--json` 입력 모드 (낮은 우선순위)

```bash
# 현재 방식 (shell escaping 실수 가능)
linear issue create --team "Backend" --title "Fix the \"parser\" bug"

# JSON 입력 방식 (에이전트에게 더 안전)
linear issue create --json '{"team":"Backend","title":"Fix the \"parser\" bug"}'
```

중첩된 따옴표나 특수문자가 있을 때 shell escaping 문제를 회피할 수 있다.

#### 5. Exit code 세분화 (낮은 우선순위)

현재 모든 에러가 exit code 1이다. 에이전트는 exit code로 재시도 여부를 판단할 수 있다:

- `1` = 사용자 입력 에러 (재시도 불필요)
- `2` = 인증 에러
- `3` = API/네트워크 에러 (재시도 가능)

## 우선순위 정리 (Claude Code 관점 반영)

| 우선순위 | 개선사항 | 노력 | 효과 | 비고 |
|---------|---------|------|------|------|
| 높음 | `CLAUDE.md` 에이전트 가이드 추가 | 낮음 | 높음 | 즉시 적용 가능, 컨텍스트 비용 최소 |
| 보류 | `--help --json` 스키마 인트로스펙션 | 중간 | 현재 규모에서 낮음 | 커맨드 수 증가 시 재검토 |
| 보류 | `--dry-run` 플래그 | 중간 | 현재 규모에서 낮음 | resolver가 이미 검증 역할 수행 |
| 낮음 | stdin 입력 모드 (`--stdin`) | 중간 | 중간 | `--json`보다 shell escaping 근본 해결 |
| 낮음 | Exit code 세분화 | 낮음 | 낮음 | JSON 에러 메시지로 충분히 판별 가능 |

## Claude Code 고유의 관점

위 분석은 일반적인 "에이전트"를 전제로 하지만, 이 프로젝트의 주 소비자는 Claude Code이다. Claude Code의 CLI 사용 패턴을 고려하면 몇 가지 시사점이 달라진다.

### Plain text help가 실제로는 잘 작동한다

Claude Code는 `--help` 텍스트를 읽고 커맨드를 구성하는 것을 꽤 잘 한다. JSON 스키마 인트로스펙션이 이론적으로는 우월하지만, 커맨드 9개 규모의 CLI에서는 plain text help로도 충분히 정확한 호출을 생성한다. `--help --json`의 실제 이점은 커맨드 수가 수십~수백 개로 늘어날 때 발생한다.

### 에러 메시지의 자기 복구 루프

현재 에러 메시지에 `Run "linear issue --help" for usage.`라고 안내하면, Claude Code는 실제로 해당 help 커맨드를 실행하여 올바른 사용법을 확인하고 재시도한다. 이 패턴이 이미 환각 방지 안전장치로 작동하고 있으며, 별도의 `--describe` 없이도 자기 교정이 가능하다.

### Shell escaping은 실제 문제이다

Claude Code는 Bash 도구를 통해 CLI를 호출한다. `--description` 같은 긴 텍스트 필드에 마크다운, 따옴표, 특수문자가 포함될 때 shell escaping 실수가 발생할 수 있다. 다만 이 문제는 `--json` 입력 모드로도 완전히 해결되지 않는다 — JSON 문자열 자체도 shell에서 escaping이 필요하기 때문이다. stdin 파이프(`echo '...' | linear issue create --stdin`)가 더 근본적인 해결책일 수 있다.

### 컨텍스트 비용 트레이드오프

이 프로젝트의 존재 이유가 "MCP 대비 컨텍스트 절감"이다. 개선안을 평가할 때 컨텍스트 비용 관점이 필요하다:

- **CLAUDE.md** — 세션 시작 시 한 번만 읽히므로 컨텍스트 비용 낮음. 효과 대비 비용 최적.
- **`--help --json`** — JSON 스키마 출력이 plain text보다 길어질 수 있다. 커맨드 9개 규모에서는 오히려 컨텍스트를 더 소비할 수 있음.
- **`--dry-run`** — 호출이 2배(dry-run + 실제)가 되므로 컨텍스트 비용 증가. resolver 에러가 이미 충분히 빠르게 실패하는지 먼저 확인 필요.

## 규모 적합성 평가

`gws`는 수백 개 API 엔드포인트를 커버하는 대규모 CLI이다. 이 프로젝트는 커맨드 9개의 소규모 CLI이므로, 모든 원칙이 동일한 비중으로 적용되지는 않는다.

| 원칙 | gws 규모에서 | linear-cli 규모에서 |
|------|-------------|-------------------|
| JSON-first 출력 | 필수 | 필수 (이미 적용) |
| 런타임 스키마 인트로스펙션 | 필수 — 수백 개 커맨드를 docs로 커버 불가 | 선택적 — CLAUDE.md로 충분히 커버 가능 |
| 동적 커맨드 서페이스 | 핵심 — API Discovery 기반 자동 생성 | 해당 없음 — Linear SDK는 정적 |
| NDJSON 페이지네이션 | 유용 — 대량 데이터 스트리밍 | 과잉 — limit 10~50건이면 단일 JSON 배열로 충분 |
| Agent Skills 문서 | 필수 — 100+ SKILL.md | CLAUDE.md 하나로 충분 |
| Dry Run | 유용 — 복잡한 API 호출 검증 | 선택적 — resolver가 이미 입력 검증 역할 |

## 결론

이 프로젝트는 이미 Poehnelt이 주장하는 핵심 원칙(JSON 출력, 구조화된 에러, 이름 해석)을 잘 따르고 있다. MCP 대신 CLI를 택한 설계 결정 자체가 올바른 방향이다.

다만 `gws`와의 규모 차이를 인식해야 한다. 커맨드 9개 규모에서 가장 효과적인 개선은 복잡한 기능 추가가 아니라 **CLAUDE.md를 통한 사용 패턴 문서화**이다. `--help --json`이나 `--dry-run`은 프로젝트가 성장하여 커맨드 수가 늘어날 때 재검토하면 된다.

에러 메시지가 help 커맨드를 안내하는 현재 패턴이 이미 Claude Code와의 자기 복구 루프를 형성하고 있으며, 이는 Poehnelt이 제안하는 "환각 방지 안전장치"의 실용적 구현이다.

## 참고 자료

- [You Need to Rewrite Your CLI for AI Agents](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/)
- [The MCP Abstraction Tax](https://justin.poehnelt.com/posts/mcp-abstraction-tax/)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=47252459)
