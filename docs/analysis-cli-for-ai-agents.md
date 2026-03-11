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

## 우선순위 정리

| 우선순위 | 개선사항 | 노력 | 효과 |
|---------|---------|------|------|
| 높음 | `CLAUDE.md` 에이전트 가이드 추가 | 낮음 | 높음 — 즉시 Claude Code 사용성 향상 |
| 높음 | `--help --json` 스키마 인트로스펙션 | 중간 | 높음 — 에이전트가 정확한 커맨드 생성 |
| 중간 | `--dry-run` 플래그 | 중간 | 중간 — 안전한 쓰기 작업 |
| 낮음 | `--json` 입력 모드 | 중간 | 낮음 — 현재 플래그 방식도 충분히 작동 |
| 낮음 | Exit code 세분화 | 낮음 | 낮음 — JSON 에러 메시지로 충분히 판별 가능 |

## 결론

이 프로젝트는 이미 Poehnelt이 주장하는 핵심 원칙(JSON 출력, 구조화된 에러, 이름 해석)을 잘 따르고 있다. MCP 대신 CLI를 택한 설계 결정 자체가 올바른 방향이다. 가장 빠르게 효과를 볼 수 있는 개선은 **CLAUDE.md 작성**과 **`--help --json` 스키마 인트로스펙션 추가**이다.

## 참고 자료

- [You Need to Rewrite Your CLI for AI Agents](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/)
- [The MCP Abstraction Tax](https://justin.poehnelt.com/posts/mcp-abstraction-tax/)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=47252459)
