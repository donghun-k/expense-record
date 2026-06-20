# 트리아지 라벨

스킬들은 다섯 가지 표준 트리아지 역할로 말한다. 이 파일은 그 역할을 이 저장소 이슈 트래커에서 실제로 사용하는 라벨 문자열에 매핑한다.

이 저장소는 **혼자 작업하는 프로젝트**이므로, 라벨은 메인테이너(=나)와 위임 대상(에이전트/직접 작업)을 구분하도록 단순화했다.

| mattpocock/skills 역할 | 우리 라벨     | 의미                                          |
| ---------------------- | ------------- | --------------------------------------------- |
| `needs-triage`         | `triage`      | 아직 평가하지 않은 새 아이디어/버그 — 직접 분류 필요 |
| `needs-info`           | `blocked`     | 조사·결정이 더 필요해 진행 불가                |
| `ready-for-agent`      | `agent-ready` | 명세 완료 → AFK 에이전트에게 위임 가능          |
| `ready-for-human`      | `todo`        | 내가 직접 구현                                 |
| `wontfix`              | `wontfix`     | 하지 않음                                      |

스킬이 역할을 언급하면(예: "AFK 준비 트리아지 라벨을 적용하라"), 이 표에서 대응하는 라벨 문자열(`agent-ready`)을 사용한다.

사용하는 어휘가 바뀌면 오른쪽 열을 수정한다.

## GitHub 라벨 생성

위 라벨이 저장소에 아직 없다면 한 번 생성해 둔다:

```bash
gh label create triage      --description "분류 필요"           --color FBCA04
gh label create blocked     --description "조사·결정 필요"       --color D93F0B
gh label create agent-ready --description "AFK 에이전트 위임 가능" --color 0E8A16
gh label create todo        --description "직접 구현"           --color 1D76DB
gh label create wontfix     --description "하지 않음"           --color FFFFFF
```
