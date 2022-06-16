# 4-backend-Zoe-mytudyLibrary

---

## :books: 내 주변의 도서관 찾는 사이트 :books:

프로젝트 명: myStudyLibrary

작성자: 김예지

백엔드 프로젝트 진행날짜: 2022-03 중순 ~ 2022-05 중순

프론트 프로젝트 진행날짜: 2022-05 중순 ~ 2022-06 중순

read.me 작성연월: 2022-06

:clipboard:프로젝트 링크: https://mystudylibrary.pe.kr

* 참고사항: 보안상 letsencrypt에서 발급받은 ssl인증서를 적용했고 비밀번호는 암호화돼서 저장됩니다.

## :closed_book: 프로젝트 설명

사용자의 지역을 입력하면 그 지역의 도서관이 검색되는 복지 사이트 입니다.

각 도서관 페이지에 평점, 후기를 남길 수 있고 사이트 사용자들끼리 커뮤니티 글을 공유할 수 있습니다.

---

## :ledger: 프로젝트 기획 및 설계

### 프로젝트 기획

ovenapp.io 툴 이용했습니다.  




<details>
    <summary> 🧷 기획 예시 사진 및 링크 </summary>
    <br>

* 예시 이미지
![image](https://user-images.githubusercontent.com/98700133/173318356-b076ce39-37cf-4abc-8ea7-c76c7eecfb4f.png)

1. :clipboard: [기획 링크](https://ovenapp.io/view/sM4TbEvWMLijyHLw5oZIhUubP99mgGUD/gHdLH)
2. 왼쪽 하단의 '메모 표시'를 누르면 각 페이지와 기능에 대한 설명을 볼 수 있습니다.
3. 화살표를 누르거나 '페이지 목록'을 누르면 다른 페이지로 넘어갈 수 있습니다.
4. '링크 영역 표시'를 누르면 누를 수 있는 영역을 확인할 수 있습니다.

* 해당 프로젝트를 진행하면서 초반 기획과 달라진 부분들이 꽤 있으니 참고 바랍니다.

<!-- summary 아래 한칸 공백 두고 내용 삽입 -->

</details>

### 프로젝트 설계

![image](https://user-images.githubusercontent.com/98700133/173525786-726ad8f8-07ef-42e5-bc50-8012911aca4d.png)

해당 레포는 위의 설계 중 백엔드 서버 부분에 해당합니다.


### 프로젝트 DB 테이블

* aquerytool 사이트를 이용해서 테이블 설계

:clipboard: [테이블과 테이블 구성요소](https://closed-glade-095.notion.site/myStudyLibrary-DB-6bc5bd5da4f9483ab37bf6af83cf3e55)


-----------------------------
###  📁 디렉토리 구조

<details>
    <summary> 디렉토리 구조 펼쳐보기</summary>

```bash
├── controllers
│   ├── board.js
│   ├── comment.js
│   ├── library.js
│   ├── review.js
│   ├── user.js
│   └── wiseSaying.js
├── models
│   ├── board.js
│   ├── comment.js
│   ├── library.js
│   ├── review.js
│   ├── user.js
│   └── wiseSaying.js
├── routes
│   ├── board.js
│   ├── comment.js
│   ├── library.js
│   ├── review.js
│   ├── user.js
│   └── wiseSaying.js
├── terms
│   ├── signUpGuide.html
├── customModule # 해당 디렉토리에 비즈니스 로직이나 분류가 애매한 파일 포함
│   ├── changeDataForm.js
│   ├── checkDataOrAuthority.js
│   ├── checkValidation.js
│   ├── dateTime.js
│   ├── modelLog.js
│   ├── pwBcrypt.js
│   ├── randomNum.js
│   ├── requestOpenApi.js
│   ├── scraping.js
│   ├── statusCode.js
│   └── uploadImage.js
├── orm # sequelize 
│   ├── models
│   │   ├── board.cjs
│   │   ├── comment.cjs
│   │   ├── favoritePost.cjs
│   │   ├── library.cjs
│   │   ├── log.cjs
│   │   ├── review.cjs
│   │   ├── tag.cjs
│   │   ├── user.cjs
│   │   ├── userLibrary.cjs
│   │   ├── wiseSaying.cjs
│   │   ├── withdrwalUser.cjs
│   │   └── index.mjs
├── profileImage
├── .env
├── .eslintrc
├── .gitignore
├── .prettierrc
├── app.js
├── ormConfig.js
├── package.json
├── package-lock.json
└──  README.md
```

<!-- summary 아래 한칸 공백 두고 내용 삽입 -->

</details>


------------------
## :blue_book: 주요 기능
 
* express-validator 미들웨어를 통해 route에서 유효성검사를 해줬습니다. 필요한 경우 정규표현식을 사용했습니다.
    
* 회원가입/비밀번호 수정 기능
    
    * '비밀번호'는 salting과 키 스트레칭을 구현한 bcrypt 해시 함수로 암호화 후 저장했습니다.
    
    * '비밀번호 확인'은 '비밀번호'와 일치하는지 여부로 유효성 여부 판별했습니다.
    
* 프로필 사진 수정 기능
    
    * multipart/formdata 형식 데이터를 다루기 위해서 multer 미들웨어를 사용해줬습니다.
    
    * .jpg/.jpeg/.png/.gjf 확장자일때만 유효성 검사를 통과하도록 해줬습니다.

* 회원 탈퇴 기능
    
    * 유저가 탈퇴시 탈퇴한 유저의 정보는 'user' 테이블에서 'withdrawalUser' 테이블로 이동시켜줍니다. 
    
    * 이벤트 스케쥴러를 통해 탈퇴 후 일정 기간이 지난 탈퇴유저의 정보는 주기적으로 'withdrawalUser' 테이블에서 영구삭제합니다.

* 댓글/대댓글 작성 및 조회 기능
    
    * 루트댓글과 대댓글을 나눠서 작성 및 조회할 수 있도록 했습니다. 대댓글에는 하위 대댓글을 작성할 수 없습니다.
    
    * 이를 위해 'comment' 테이블에 parentIndex 라는 컬럼을 두고 루트댓글인 경우는 값을 null로 두고 대댓글인 경우는 루트 댓글의 commentIndex 값이 들어가도록 했습니다.
    
    * 페이지네이션을 해서 한 페이지에 최근 작성된 5개의 루트댓글만 조회를 하고 해당 5개 루트댓글의 commentIndex가 parentIndex인 대댓글들을 조회해줬습니다.
    
    * 프론트 서버에서는 순서대로 배치만 하면 되도록 정렬해줬습니다.

* 게시글 조회시 조회수 중복체크
    
    * 글 조회시 유효기간이 하루인 쿠키를 발급해서 ';'를 구분자로 조회한 게시글들의 인덱스가 값으로 들어가도록 했습니다. (ex. '1;2;3;4;5;')
    
    * 쿠키의 값을 ';'를 구분자로 파싱해준 뒤 해당 배열의 값 중 조회한 게시글의 값이 있는지 확인하는 방식으로 조회수 중복체크를 해줬습니다.

* 응답해줄 데이터 가공
    
    * 게시글 목록 데이터나 도서관 목록 데이터는 모바일 기기에서 조회해도 글자수가 잘리지 않도록 특정 글자수가 넘어가면 파싱해줬습니다.
    
    * 삭제된 댓글의 경우 댓글의 내용을 '삭제된 댓글입니다' 로 바꿔줬습니다.
    
    * 게시글이나 댓글 데이터를 작성한 유저가 탈퇴한 유저일 경우 닉네임을 '탈퇴한 유저' 로 바꿔줬습니다.  

    * 조회수나 좋아요 수가 특정 글자 수를 넘어가면 M, K를 붙여서 표현하도록 해줬습니다.
    
    * 유저가 작성한 리소스의 작성일이 오늘일 때는 'YYYY년MM월DD일 hh시mm분', 오늘이 아닐때는 'YYYY년MM월DD일'의 형태로 표현되도록 해줬습니다.
    
    * DB에 도서관의 종류(libraryType) 컬럼을 문자형이 아닌 숫자형으로 저장했기 때문에 응답해줄 데이터를 저장된 숫자 값에 맞는 문자열로 바꿔줬습니다. 

---

## :closed_book: 개발 스택

- 사용스택: js, node.js + express.js, mysql, sequelize, pm2(서버에 무중단 배포)

---

## 문제사항과 해결방안

### 1.
문제/해결방안 링크:
https://closed-glade-095.notion.site/myStudyLibrary-2-ec21cf5b53b0428f9bce3c5fa2ff9736

### 2.
문제/해결방안 링크:
https://www.notion.so/myStudyLibrary-2-2cc8fc2aa67d4224bb7336ad2e08c744

-----------------
## 💭 프로젝트 진행 후 느낀점과 개선하고 싶은 점
### 느낀점

### 개선하고 싶은 점


------
## 프로젝트 시연 영상(보류)


-------
## 실제 프로젝트 캡쳐(POSTMAN을 이용한 요청과 응답)

* 전체 도서관 정보

![image](https://user-images.githubusercontent.com/98700133/174029682-ed73cf99-45b7-45b8-b6ed-bacd5dc6bf50.png)

* 특정 도서관 조회
![image](https://user-images.githubusercontent.com/98700133/174029740-4824e9f9-02eb-425b-a45d-fd12198cc5d0.png)

* 로그인 요청
![image](https://user-images.githubusercontent.com/98700133/174029886-22edca99-f2ab-4780-a8ae-3b7ccadbf276.png)

* 로그인 성공 응답 받은 뒤 쿠키 확인('token' 이라는 이름의 쿠키가 있으면 로그인 성공)
![image](https://user-images.githubusercontent.com/98700133/174029938-ed9fcfe1-a217-4cca-8c66-d5ab19701728.png)



