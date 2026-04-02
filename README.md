# OOSY MVP

학교 밖 청소년을 위한 **짧은 강좌·정보 글**과 **Q&A 스레드 댓글** 커뮤니티입니다.  
**Next.js**(App Router) · **Tailwind CSS** · **Firebase**(Authentication + Firestore)로 구성했습니다.

## 스택

- **프론트**: React 19, Next.js 16, TypeScript, Tailwind CSS 4  
- **백엔드/DB**: Firebase Auth, Cloud Firestore  
- **본문**: Markdown(`react-markdown`, GFM, `rehype-sanitize`)

## 로컬 실행

1. `.env.local.example`이 있으면 복사해 `.env.local`을 만들고 Firebase 웹 앱 설정값을 채웁니다.  
2. `npm install` → `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Firebase 콘솔 설정

- **Authentication**: 아래 **카카오 + Firebase 로그인** 참고  
- **Firestore**: `firestore.rules` · `firestore.indexes.json` 배포  
  (`firebase deploy --only firestore` 또는 콘솔에서 규칙·인덱스 반영)  
- **관리자**: Firestore `admins` 컬렉션에 문서 ID = 관리자 계정 **UID**인 문서 추가

규칙·인덱스를 배포하지 않으면 클라이언트에서 권한 오류·인덱스 오류가 날 수 있습니다.

---

## 카카오 + Firebase 로그인 설정

이 프로젝트는 `OAuthProvider("oidc.kakao")`를 사용합니다. **Firebase에 등록하는 OIDC 제공업체 ID가 코드와 같아야** 합니다.

### 1) Firebase 콘솔 (먼저 리다이렉트 URI 확인)

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 선택  
2. **빌드** → **Authentication** → **Sign-in method**  
3. **OpenID Connect** 제공업체 추가 전, **승인된 리다이렉트 URI**를 메모합니다.  
   - 예: `https://<프로젝트ID>.firebaseapp.com/__/auth/handler`  
4. 아래 2번에서 카카오 앱에 **동일한 URI**를 등록합니다.

### 2) 카카오 개발자 콘솔

1. [Kakao Developers](https://developers.kakao.com/) → 내 애플리케이션  
2. **REST API 키** 확인 (Firebase OIDC Client ID로 사용)  
3. **카카오 로그인** 활성화  
4. **Redirect URI**에 Firebase **승인된 리다이렉트 URI** 등록  
5. OIDC·동의 항목은 카카오 문서에 맞게 설정

### 3) Firebase — OpenID Connect 제공업체

1. **Authentication** → **Sign-in method** → **OpenID Connect** → **추가**  
2. 예시 설정  
   - **Provider ID**: `oidc.kakao` ← **코드와 동일해야 함**  
   - **Issuer**: `https://kauth.kakao.com`  
   - **Client ID**: 카카오 **REST API 키**  
   - **Client secret**: 카카오 앱 설정에 따름  
3. 저장 후 **사용 설정**

### 4) 로컬 확인

1. `.env.local`에 Firebase 웹 설정이 있는지 확인  
2. `/login`에서 **카카오로 로그인**  
3. `auth/operation-not-allowed` → OIDC 미사용 또는 Provider ID 불일치 가능성

---

## Firestore 데이터 모델 (요약)

| 컬렉션 / 문서 | 설명 |
|---------------|------|
| `posts` | `title`, `content`(마크다운), `category`, `region`, `authorId`, `createdAt`, `updatedAt`, `status`(`pending`/`approved`), `commentsEnabled` |
| `comments` | `postId`, `content`, `authorId`, `createdAt`, `updatedAt`, `parentId`(스레드, 최상위는 `null`) |
| `postReports` | `postId`, `reporterId`, `reportType`, `status`, `createdAt`, 처리 시 `resolvedAt`, `resolvedBy` 등 (문서 ID: `postId_reporterId`) |
| `postLikes` | `postId`, `userId`, `createdAt` (문서 ID: `postId_userId`) |
| `postBookmarks` | `postId`, `userId`, `createdAt` (문서 ID: `postId_userId`) |
| `users` | `nickname`(선택), `points`(선택) — 로그인 시 기본 포인트 초기화, 보상 신청 시 차감, **글 승인 시 작성자 +1P**(관리자 트랜잭션) |
| `nicknames` | 닉네임 → `uid` 매핑 (중복 방지) |
| `rewardRequests` | 보상 신청: `userId`, `phone`, `rewardKey`, `rewardName`, `costPoints`, `status` 등 |
| `admins` | 관리자 UID 목록 (문서 ID = UID) |
| `analyticsDaily` | 일별 방문 집계(문서 ID: 날짜 키) |
| `analyticsTotals` | 예: 총 방문 수 등 집계 |

신규 글은 `pending`이며, 관리자만 `status`를 `approved`로 변경할 수 있습니다. 승인 시 **작성자 `users` 문서가 있어야** 포인트 지급이 됩니다(로그인 후 `ensureMyPoints` 등으로 문서 생성 권장).

---

## 페이지·라우트

| 경로 | 설명 |
|------|------|
| `/` | 홈 — 승인된 글 목록, 카테고리·지역 필터 |
| `/write` | 새 글 작성 |
| `/posts/[id]` | 글 상세, Q&A, 좋아요·북마크, 신고, 점 메뉴 |
| `/posts/[id]/edit` | 본인 **승인 대기** 글 수정 |
| `/search` | 검색 결과 (`?q=` 제목·본문 부분 일치, 클라이언트 필터·최근 승인 글 범위) |
| `/points` | 포인트 조회, 보상 카드 신청(전화번호, 트랜잭션 차감) |
| `/mypage` | 승인 대기 글, 내 활동(글·질문·북마크·좋아요) |
| `/nickname` | 닉네임 설정(형식·중복 규칙) |
| `/admin` | 관리자 — 대기 승인/거부, 공개 글, 신고, 보상 신청, 통계 |
| `/login` | 카카오 로그인 |

전역 **헤더**(검색 패널·포인트 링크)와 **하단 탭**(홈·글쓰기·관리(관리자)·마이페이지)이 있습니다.

---

## 구현된 기능 정리

### 인증·프로필

- 카카오 OIDC 로그인(`/login`)  
- 로그인 시 **포인트 문서 보정**(`ensureMyPoints`, 기본 10P), **일일 방문 로그**(`logDailyVisit`)  
- 최초 포인트 세팅 시 **로그인 보상 10P** 안내 배너(짧게 표시)  
- 닉네임 설정·변경(`/nickname`), `nicknames`·형식 검증(학밖청_/전문가_/관리자_ 등 규칙)

### 홈

- **카테고리·지역** 필터(지역은 전국·시도 등, URL 쿼리 연동)  
- **공지** 카테고리는 **관리자만** 필터·작성에서 노출  
- 승인된 글 카드: 카테고리·지역 뱃지, 제목·날짜·작성자(닉네임)  
- **점(⋯) 메뉴**: 본인 글 **삭제**, 로그인 사용자 **신고**(유형 선택·확인)  
- **신고한 글**은 해당 사용자에게 목록/상세에서 숨김

### 글 작성·수정

- 마크다운 본문, 주제·지역, Q&A 허용 여부  
- 비관리자는 **공지** 카테고리 선택 불가  
- 승인 대기 글만 작성자가 수정 가능

### 글 상세

- 마크다운 본문 렌더링(살균)  
- **Q&A 스레드**: 질문/답글, **댓글 수정·삭제**(작성자·글 작성자·관리자 권한에 따라 점 메뉴)  
- **좋아요·북마크**: 카운트·본인 여부 Firestore 연동, 북마크 활성 시 하늘색 톤  
- **신고** 후 본인에게는 본문 숨김 처리(관리자는 신고 화면에서 `fromReport=1` 등으로 예외 진입 가능)  
- **점 메뉴**: 대기 글 **수정**, 본인 글 **삭제**, **신고**

### 검색

- 헤더 **검색 아이콘** → 패널에서 검색어 입력 후 **검색** 클릭 시 **`/search?q=`** 로 이동  
- 승인 글 제목·본문 **부분 일치** 검색(최근 로드 범위 내 클라이언트 필터)

### 포인트·보상

- 헤더 **포인트 표시** → `/points`  
- 보상 카드(예: 츄파춥스, 편의점 상품권 금액별) — **포인트 차감**은 `submitRewardRequest` **트랜잭션**으로 처리  
- 신청 시 **전화번호** 입력, 확인 모달, 부족 시 안내  
- 관리자 **`/admin` 보상 신청** 탭에서 목록·처리 완료

### 관리자(`/admin`)

- **승인 대기**: 승인 시 글 공개 + 작성자 **+1P**(트랜잭션, `users` 문서 필요), 거부 시 삭제  
- **승인된 글** 목록·삭제  
- **신고 관리**: 목록, 처리, 글 삭제, 카드 클릭 시 해당 글 상세(신고자 예외 경로)  
- **보상 신청** 처리  
- **통계**(하단): 가입자 수, 게시글 수, 질문 수, 카테고리별 게시글 수, 일일 방문, 30일 평균 일 방문, 총 방문 등

### 마이페이지

- **승인 대기** 내 글 목록·삭제  
- **내 활동**: 내 글, **내 질문**(최상위 댓글 본문), 북마크·좋아요 글 링크

### 기타

- Firestore **보안 규칙**으로 읽기/쓰기·관리자·포인트 증감 조건 제한  
- 복합 쿼리는 `firestore.indexes.json` 기준으로 인덱스 배포 필요할 수 있음

---

## 문제 해결 팁

- **권한 거부**: `firestore.rules` 배포 여부, 로그인·관리자 문서 확인  
- **인덱스 빌드 중**: 콘솔 링크로 복합 인덱스 생성 후 대기  
- **승인 시 포인트 실패**: 작성자 `users/{uid}` 문서가 없으면 안내 메시지와 함께 실패할 수 있음 → 사용자 로그인·프로필 생성 후 재시도

---

이 README는 저장소에 포함된 구현 기준으로 정리되었습니다. 배포·운영 환경에 맞게 Firebase 프로젝트·도메인·규칙을 별도 관리하세요.
