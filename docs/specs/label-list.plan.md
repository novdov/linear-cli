# label list 구현 계획

- 스펙: `docs/specs/label-list.md`
- 참조: `src/commands/team.ts`, `src/index.ts`, `src/lib/help.ts`

## 분석

### 변경 대상

- `src/commands/label.ts` (신규): `labelList` 함수 구현
- `src/index.ts`: `label` 스코프 및 커맨드 등록
- `src/lib/help.ts`: label 도움말 추가

### 영향 범위

- 기존 코드 변경 없음, 신규 스코프 추가만 해당

## 구현 작업

- [ ] `src/commands/label.ts` 생성: `labelList(opts)` 함수 (`team.ts`의 `teamList` 패턴 참고)
- [ ] `src/index.ts` 수정: `KNOWN_SCOPES`에 `'label'` 추가, label 커맨드 등록
- [ ] `src/lib/help.ts` 수정: `HELP_MAIN`에 label 추가, `HELP_LABEL` 정의 및 `helpMessages`에 등록
