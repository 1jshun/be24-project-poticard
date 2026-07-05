# Poticard - 담당 기능 정리

> 개발자의 경험과 역량을 디지털 명함과 포트폴리오로 관리하는 커리어 플랫폼

</br>

## 바로가기

- **Service** : [Poticard](https://www.poticard.kro.kr)
- **API Docs** : [Swagger UI](https://api.poticard.kro.kr/swagger-ui/index.html)
- **Wiki** : [Poticard Wiki](https://github.com/beyond-sw-camp/be24-3rd-DevOops-Poticard/wiki)
- **Backend Repository** : [be24-3rd-DevOops-Poticard](https://github.com/beyond-sw-camp/be24-3rd-DevOops-Poticard)
- **DevOps Repository** : [be24-4th-DevOops-Poticard](https://github.com/beyond-sw-camp/be24-4th-DevOops-Poticard)


## 담당 역할

- 포트폴리오 생성·조회·수정·삭제 기능 구현
- 포트폴리오 본문 기반 AI 첨삭 및 기술 스택 추출 기능 구현
- 포트폴리오 대표 이미지 및 에디터 이미지 업로드 구조 구현
- PRO 요금제 결제 검증 및 구독 권한 확인 기능 구현
- 요금제 조회 및 혜택 데이터 변환 처리 구현

## 시스템 아키텍처
<img width="1920" height="991" alt="Image" src="https://github.com/user-attachments/assets/1076de02-6b7c-4f8d-959a-52e630cbcc00" />

---

## 1. Portfolio

사용자가 포트폴리오를 생성하고, 섹션 단위로 내용을 구성하며, AI를 활용해 문장을 첨삭하고 기술 스택을 추출할 수 있는 기능을 담당했습니다.

### 주요 기능

- **포트폴리오 생성 및 관리**
  - 제목, 기간, 역할, 다수의 섹션 정보를 포함한 포트폴리오 생성
  - 대표 이미지 업로드 지원
  - 포트폴리오 조회, 수정, 삭제 기능 제공

- **AI 첨삭 기능**
  - PRO 요금제 사용자에게만 제공되는 기능으로 구성
  - Gemini 2.5 Flash 모델을 활용해 포트폴리오 본문을 전문적이고 실무적인 표현으로 교정

- **AI 기반 기술 스택 추출**
  - 포트폴리오 본문에서 실제 사용한 언어, 프레임워크, 데이터베이스 등의 기술 스택 추출
  - 추출된 기술 스택을 키워드 형태로 저장

- **스타일 설정**
  - 포트폴리오 렌더링을 위한 테마, 레이아웃 타입 설정
  - 섹션별 표시 순서 및 숨김 여부 관리

- **클라우드 파일 업로드**
  - 포트폴리오 대표 이미지와 에디터 내 첨부 이미지를 클라우드 스토리지에 업로드
  - 에디터 이미지가 Base64로 DB에 직접 저장되는 문제를 방지

- **페이징 조회**
  - 포트폴리오 목록 조회 시 `page`, `size` 기반 페이징 처리 적용
  - 불필요한 데이터 조회를 줄여 목록 렌더링 성능 개선

### 기술 도입 배경

#### Quill Editor

포트폴리오 작성 시 자유로운 리치 텍스트 편집 경험을 제공하기 위해 Quill Editor를 도입했습니다.  
특히 에디터 내 이미지 삽입 시 기본 Base64 저장 방식은 DB 부하를 유발할 수 있기 때문에, 커스텀 이미지 핸들러를 구현하여 이미지를 별도 스토리지로 업로드하도록 처리했습니다.

#### AWS S3

애플리케이션 서버의 무상태성을 유지하고, 파일 I/O로 인한 서버 부하를 줄이기 위해 정적 미디어 저장소로 AWS S3를 활용했습니다.  
이를 통해 포트폴리오 이미지 요청을 서버와 분리하고, 향후 서버 확장에도 유연하게 대응할 수 있도록 구성했습니다.

#### Gemini API

포트폴리오 첨삭과 기술 스택 자동 추출 기능을 구현하기 위해 Gemini API를 활용했습니다.  
사용자가 작성한 내용을 분석해 문장을 개선하거나, 문맥상 실제 사용한 기술 스택을 추출하는 방식으로 포트폴리오 작성 경험을 개선했습니다.

### AI 분석 흐름

1. 클라이언트가 포트폴리오 본문 분석을 요청
2. 사용자 결제 내역을 조회하여 PRO 요금제 활성화 여부 확인
3. 요청 목적에 따라 첨삭 또는 기술 스택 추출 프롬프트 구성
4. `RestTemplate`을 통해 Gemini 2.5 Flash 모델 호출
5. 응답받은 JSON 데이터를 `ObjectMapper`로 파싱 및 정제
6. 첨삭된 문장 또는 기술 스택 리스트를 클라이언트에 반환

---

## 2. Orders and Plans

사용자의 결제 내역을 검증하고, PRO 요금제 구독 상태를 확인하여 유료 기능 접근 권한을 제어하는 기능을 담당했습니다.

### 주요 기능

- **결제 위변조 검증**
  - PortOne SDK를 통해 실제 결제 정보를 조회
  - 클라이언트가 전달한 결제 금액과 PG사 결제 금액을 비교
  - 금액 불일치 시 위변조 가능성으로 판단하여 결제 저장 차단

- **PRO 요금제 확인**
  - 사용자의 최신 결제 내역을 기준으로 PRO 요금제 활성화 여부 확인
  - AI 첨삭 등 PRO 전용 기능 접근 제어에 활용

- **결제 내역 저장**
  - 결제 상태와 금액 검증을 통과한 정상 결제 건만 DB에 저장
  - 결제 성공 여부, PG 결제 ID, 주문 번호, 요금제 코드 등 관리

- **요금제 조회**
  - 사용자가 구독 가능한 FREE, PRO 등의 요금제 정보 조회
  - 요금제별 가격과 혜택 정보를 프론트엔드에 제공

- **혜택 데이터 변환 처리**
  - DB에 문자열 형태로 저장된 요금제 혜택 데이터를 `StringListConverter`를 통해 `List<String>` 형태로 변환

### 핵심 엔티티

#### Orders

결제가 완료된 주문의 상세 내역을 저장하는 엔티티입니다.

- `idx`: 주문 고유 식별자
- `paid`: 실제 결제 완료 및 검증 성공 여부
- `paymentPrice`: 최종 결제 금액
- `pgPaymentId`: PG사에서 발급한 결제 ID
- `merchantUid`: 서비스 내부 주문 번호
- `planCode`: 구독 플랜 코드
- `email`: 결제자 이메일
- `user`: 사용자 엔티티와 N:1 관계

### 결제 검증 및 저장 흐름

1. 프론트엔드에서 결제 완료 후 `/orders/verify` API 호출
2. 요청 데이터로 `paymentId`, `amount`, `merchantUid`, `planCode` 전달
3. `OrdersService`에서 PortOne SDK의 `PaymentClient`를 사용해 결제 정보 조회
4. 결제 상태가 완료 상태인지 확인
5. PG사 실제 결제 금액과 클라이언트 요청 금액 비교
6. 검증 실패 시 예외 처리
7. 검증 성공 시 `Orders` 엔티티 생성 후 `paid = true` 상태로 저장
8. 결제 성공 응답 반환

### PRO 요금제 확인 흐름

1. 클라이언트가 `/orders/check-pro` API 호출
2. `OrdersRepository`에서 사용자의 성공 결제 내역 중 최신 결제 1건 조회
3. 최신 결제의 `planCode`가 `PRO`인지 확인
4. PRO 요금제이면 `true`, 아니면 `false` 반환

---

## 사용 기술

`Java` `Spring Boot` `MariaDB` `AWS S3` `PortOne` `Gemini API` `Quill Editor`

---
