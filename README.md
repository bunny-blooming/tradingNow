# Bunnyeap Trading Note

충동 매매를 줄이기 위한 모바일 우선 PWA 매수 수첩입니다.

## 기능

- 매수 전 체크리스트
- 차트 이미지 첨부
- 비슷한 유형 차트 이미지 선택 첨부
- 매수 이유와 손절 이유 기록
- 매수가, 매수 가능금액, 예상 매도가, 손절가 입력
- 예상 수익률, 가능금액 기준 예상 수익금, 손절률 계산
- 브라우저 로컬 저장소에 기록 보관

## 로컬 실행

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

브라우저에서 엽니다.

```text
http://127.0.0.1:5173/
```

이전 화면이 계속 보이면 캐시 초기화 페이지를 한 번 엽니다.

```text
http://127.0.0.1:5173/reset.html
```

## GitHub Pages 배포

GitHub에 올린 뒤 저장소에서 Pages를 켭니다.

1. 저장소 `Settings`로 이동
2. `Pages` 선택
3. `Source`를 `Deploy from a branch`로 선택
4. `Branch`를 `main`, 폴더를 `/root`로 선택
5. 저장 후 표시되는 URL을 폰에서 열기

폰에서 저장한 기록은 폰 브라우저에 저장됩니다.
