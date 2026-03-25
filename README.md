# OOSY MVP

학교 밖 청소년을 위한 **짧은 강좌·정보 글**과 **댓글** 커뮤니티입니다.  
Next.js(App Router), Tailwind CSS, Firebase(Auth + Firestore)로 구성했습니다.

## 로컬 실행

1. `.env.local.example`을 복사해 `.env.local`을 만들고 Firebase 웹 앱 값을 채웁니다.
2. `npm install` 후 `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Firebase 콘솔 설정

- **Authentication**: 이메일/비밀번호 제공업체 사용
- **Firestore**: `firestore.rules`와 `firestore.indexes.json` 배포  
  (`firebase init` 후 `firebase deploy --only firestore` 또는 콘솔에서 규칙·인덱스 수동 반영)
- **관리자**: Firestore에 `admins` 컬렉션을 만들고, 문서 ID를 관리자 계정의 **UID**로 한 빈 문서를 추가합니다. 해당 사용자에게 `/admin`과 승인 버튼이 보입니다.

## 데이터 모델

- `posts`: `title`, `content`, `category`, `authorId`, `createdAt`, `status` (`pending` | `approved`)
- `comments`: `postId`, `content`, `authorId`, `createdAt`

신규 글은 항상 `pending`이며, 관리자만 `status`를 `approved`로 바꿀 수 있습니다(보안 규칙 반영).
