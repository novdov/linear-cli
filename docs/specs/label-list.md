# label list 기능

## 목표

`linear label list` 명령으로 workspace 전체 또는 특정 팀의 라벨 목록을 조회할 수 있도록 한다

## 상세

### 명령어

```bash
linear label list [--team <name>]
```

- `--team` 옵션 없이 실행하면 전체 라벨 조회 (필터 없이 호출)
- `--team` 옵션을 지정하면 해당 팀의 라벨만 조회

### 페이지네이션

- 기존 패턴과 동일하게 첫 페이지만 반환 (SDK 기본 페이지 크기)

### 출력 필드

```json
[
  { "id": "...", "name": "Bug" },
  { "id": "...", "name": "Feature" }
]
```

- `id`, `name`만 포함 (그룹/부모 라벨 정보 미포함)

### 구현

- `src/commands/label.ts` 파일 생성
- `src/lib/resolver.ts`의 `resolveTeamId`를 재사용하여 팀 이름/키를 ID로 변환
- Linear SDK의 `client.issueLabels({ filter })` 사용
  - 팀 필터: `{ filter: { team: { id: { eq: teamId } } } }`
  - 전체 조회: 필터 없이 호출
- `src/index.ts`에 `label` 스코프 등록
- `src/lib/help.ts`에 label 도움말 추가

### 기존 패턴 준수

- `team list`와 동일한 구조 (scope + list subcommand)
- `getClient()`, `outputJSON()`, `outputError()` 사용
- `KNOWN_SCOPES`에 `'label'` 추가

## 경계

- 항상: JSON 출력, 기존 코드 패턴 따르기
- 절대: label create/update/delete는 이 스펙 범위에 포함하지 않음

## 검증

- `linear label list` 실행 시 전체 라벨이 JSON 배열로 출력되는지 확인
- `linear label list --team <팀이름>` 실행 시 해당 팀 라벨만 출력되는지 확인
- `linear label --help` 실행 시 도움말 출력 확인
- 존재하지 않는 팀 이름 지정 시 에러 메시지 출력 확인
