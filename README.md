# OOSY MVP

학교 밖 청소년을 위한 **짧은 강좌·정보 글**과 **Q&A 스레드 댓글** 커뮤니티입니다.  
Next.js(App Router), Tailwind CSS, Firebase(Auth + Firestore)로 구성했습니다.

## 로컬 실행

1. `.env.local.example`을 복사해 `.env.local`을 만들고 Firebase 웹 앱 값을 채웁니다.
2. `npm install` 후 `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Firebase 콘솔 설정

- **Authentication**: 아래 **카카오 + Firebase 로그인 설정** 참고 (OIDC)
- **Firestore**: `firestore.rules`와 `firestore.indexes.json` 배포  
  (`firebase init` 후 `firebase deploy --only firestore` 또는 콘솔에서 규칙·인덱스 수동 반영)
- **관리자**: Firestore에 `admins` 컬렉션을 만들고, 문서 ID를 관리자 계정의 **UID**로 한 빈 문서를 추가합니다. `/admin`에서 **승인 대기** 승인·거부(삭제), **공개 글** 삭제(댓글 포함), **신고 관리**(처리/글 삭제)가 가능합니다. 규칙 배포 후에만 동작합니다.

## 카카오 + Firebase 로그인 설정

이 프로젝트는 `OAuthProvider("oidc.kakao")`를 사용합니다. **Firebase에 등록하는 OIDC 제공업체 ID가 코드와 같아야** 합니다.

### 1) Firebase 콘솔 (먼저 리다이렉트 URI 확인)

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 선택  
2. **빌드** → **Authentication** → **Sign-in method**  
3. **OpenID Connect** 제공업체 **추가**를 선택하기 전에, 동일 화면/프로젝트 설정에서 **승인된 리다이렉트 URI** 목록에 나오는 값을 메모합니다.  
   - 형태 예: `https://<프로젝트ID>.firebaseapp.com/__/auth/handler` (실제 값은 콘솔 기준)  
4. 아래 2번에서 카카오 앱에 **동일한 URI**를 등록합니다.

### 2) 카카오 개발자 콘솔

1. [Kakao Developers](https://developers.kakao.com/) → 내 애플리케이션 → 앱 추가  
2. **앱 키**에서 **REST API 키**를 확인합니다 (Firebase OIDC Client ID로 사용).  
3. **제품 설정** → **카카오 로그인** 활성화  
4. **Redirect URI**에 Firebase에서 복사한 **승인된 리다이렉트 URI**를 그대로 등록합니다.  
5. **OpenID Connect**를 사용하는 경우, 카카오 문서에 따라 **OIDC** 관련 설정(동의 항목 등)을 맞춥니다.

### 3) Firebase 콘솔 — OpenID Connect 제공업체

1. **Authentication** → **Sign-in method** → **OpenID Connect** → **추가**  
2. 다음을 맞춥니다.  
   - **Provider ID**: `oidc.kakao` ← **반드시 이 값** (코드와 동일)  
   - **Issuer (URL)**: `https://kauth.kakao.com`  
   - **Client ID**: 카카오 앱의 **REST API 키**  
   - **Client secret**: 카카오 앱에서 발급·활성화한 시크릿(앱에 따라 없을 수 있음 — 카카오 콘솔 기준)  
3. 저장 후 제공업체를 **사용 설정**합니다.

### 4) 로컬에서 확인

1. `.env.local`에 Firebase 웹 설정이 들어갔는지 확인  
2. `npm run dev` 후 `/login`에서 **카카오로 로그인**  
3. `auth/operation-not-allowed`가 나오면 Firebase에서 OIDC 제공업체가 꺼져 있거나 Provider ID가 `oidc.kakao`가 아닌 경우가 많습니다.

## 데이터 모델

- `posts`: `title`, `content`(마크다운), `category`, `region`, `authorId`, `createdAt`, `status` (`pending` 또는 `approved`), `commentsEnabled`
- `comments`: `postId`, `content`(마크다운), `authorId`, `createdAt`, `updatedAt`, `parentId` (최상위 스레드는 `null`)
- `postReports`: `postId`, `reporterId`, `reportType` (`스팸/홍보` 등), `status` (`open`/`resolved`), `createdAt`, `resolvedAt`, `resolvedBy`
- `postLikes`: `postId`, `userId`, `createdAt` (문서 ID: `${postId}_${userId}`)
- `postBookmarks`: `postId`, `userId`, `createdAt` (문서 ID: `${postId}_${userId}`)

신규 글은 항상 `pending`이며, 관리자만 `status`를 `approved`로 바꿀 수 있습니다(보안 규칙 반영).  
**승인된 글**에만 새 댓글이 달리도록 `firestore.rules`에서 제한합니다(`postAllowsNewComments`).  
마이페이지의 「승인 대기」 목록 등은 `authorId` + `status` + `createdAt` 복합 인덱스가 필요합니다(`firestore.indexes.json` 배포).

## 현재 주요 기능

- 홈: 카테고리/지역 필터, 본인 글 점 메뉴(삭제), 모든 승인 글 점 메뉴(신고)
- 글 상세:
  - 본문 + Q&A 스레드(질문/답글)
  - 댓글 수정/삭제(권한 기반)
  - 좋아요/북마크(실제 Firestore 연동)
  - 신고 접수(신고 유형 선택)
- 신고:
  - 사용자가 신고하면 본인 목록/상세에서 해당 글 숨김
  - 관리자가 `/admin`의 신고 관리 탭에서 처리/글 삭제
  - 관리자+신고자 계정은 신고 카드에서 진입 시 상세 확인 예외
- 마이페이지:
  - 승인 대기 글 관리
  - 내 활동 탭: `내 글`, `내 질문(내가 작성한 최상위 질문 댓글)`, `북마크`, `좋아요`
