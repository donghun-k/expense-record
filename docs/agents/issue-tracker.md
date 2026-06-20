# 이슈 트래커: GitHub

이 저장소의 이슈와 PRD는 GitHub Issues에 저장한다. 모든 작업은 `gh` CLI로 수행한다.

## 규칙

- **이슈 생성**: `gh issue create --title "..." --body "..."`. 여러 줄 본문은 heredoc 사용.
- **이슈 조회**: `gh issue view <number> --comments`. 필요 시 `jq`로 댓글을 필터링하고 라벨도 함께 조회.
- **이슈 목록**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`. 적절한 `--label`, `--state` 필터 적용.
- **이슈 댓글**: `gh issue comment <number> --body "..."`
- **라벨 적용/제거**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **닫기**: `gh issue close <number> --comment "..."`

저장소는 `git remote -v`로 추론한다 — `gh`는 클론 내부에서 실행하면 자동으로 인식한다.

## 트리아지 대상으로서의 풀 리퀘스트

**PRs as a request surface: no.** _(이 저장소가 외부 PR을 기능 요청으로 취급한다면 `yes`로 설정. `/triage`가 이 플래그를 읽는다.)_

`yes`로 설정하면 PR이 이슈와 동일한 라벨·상태를 거치며, `gh pr` 대응 명령을 사용한다:

- **PR 조회**: `gh pr view <number> --comments`, diff는 `gh pr diff <number>`.
- **트리아지용 외부 PR 목록**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` 후 `authorAssociation`이 `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE`인 것만 유지(`OWNER`/`MEMBER`/`COLLABORATOR` 제외).
- **댓글/라벨/닫기**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub는 이슈와 PR이 번호 공간을 공유하므로, 단순한 `#42`는 둘 중 하나일 수 있다 — `gh pr view 42`로 확인하고 안 되면 `gh issue view 42`로 폴백한다.

## 스킬이 "이슈 트래커에 게시"라고 할 때

GitHub 이슈를 생성한다.

## 스킬이 "관련 티켓을 가져오라"고 할 때

`gh issue view <number> --comments`를 실행한다.
