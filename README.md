# playok.github.io

[playok.github.io](https://playok.github.io) — 아케이드 컨셉의 개인 홈페이지.

빌드 도구나 프레임워크 없이 정적 파일만으로 동작한다. GitHub Pages가 그대로 서빙한다.

## 구조

```
index.html        TITLE / HIGH SCORE / SELECT STAGE / PLAYER
css/main.css      디자인 토큰, CRT 오버레이, 섹션 스타일
js/main.js        타이핑 효과, 카운트업, 저장소 카드 렌더
assets/
  stats.json      기여 통계 (매일 자동 갱신)
  favicon.svg
scripts/
  contrib.py      GitHub 공개 기여 페이지에서 일별 기여 수집
  build_stats.py  stats.json 생성
  pixelfont.py    5x7 비트맵 폰트 -> SVG 렌더러
```

## 기여 통계

`scripts/contrib.py`가 GitHub 공개 기여 페이지를 파싱한다. 인증이 필요 없고, 프로필 설정에 따라 비공개 저장소 기여까지 포함된 값이 나온다.

```bash
python3 scripts/build_stats.py     # assets/stats.json 갱신
python3 -m unittest discover scripts   # 테스트
```

수집이 실패하면 스크립트가 0이 아닌 코드로 끝나고 기존 `stats.json`을 건드리지 않는다. 페이지에는 마지막 확인값이 HTML에 적혀 있어, JS가 꺼져 있거나 `stats.json`을 못 읽어도 숫자가 보인다.

외부 런타임 의존성은 없다. Python은 표준 라이브러리만 쓴다.
