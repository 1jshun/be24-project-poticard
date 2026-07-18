# Poticard

> 개발자의 경험과 역량을 디지털 명함과 포트폴리오로 관리하는 커리어 플랫폼

## 프로젝트 링크

- 서비스: [Poticard](https://www.poticd.kro.kr)
- API 명세: [Swagger UI](https://api.poticard.kro.kr/swagger-ui/index.html)
- 기술 문서: [Poticard Wiki](https://github.com/beyond-sw-camp/be24-3rd-DevOops-Poticard/wiki)
- 소스 코드: [GitHub Repository](https://github.com/beyond-sw-camp/be24-3rd-DevOops-Poticard)
- 인프라 코드: [DevOps Repository](https://github.com/beyond-sw-camp/be24-4th-DevOops-Poticard)

---

<a id="zero-downtime-deployment"></a>
## 무중단 배포

Poticard는 Kubernetes 환경에서 Nginx Ingress로 외부 요청을 수신합니다. 사용자 화면은 Canary 배포로 새 버전을 소량 트래픽에 먼저 노출하고, 결제·파일 업로드 등 외부 연동이 있는 백엔드 API는 Blue-Green 배포로 활성 환경을 한 번에 전환하도록 구성했습니다.

| 대상 | 배포 방식 | Kubernetes 구성 | 적용 목적 |
|:---|:---|:---|:---|
| 프론트엔드 | Canary | Stable·Canary Deployment/Service/Ingress를 분리하고 Canary Ingress에 `canary-weight: 10` 적용 | UI·브라우저 호환성·라우팅 문제를 전체 사용자에게 반영하기 전에 소량 트래픽으로 확인 |
| 백엔드 | Blue-Green | Blue·Green Deployment를 함께 구성하고 `backend-service`의 `version` selector로 활성 환경 지정 | 새 버전을 별도 환경에서 준비한 뒤 전환하고, 문제 발생 시 이전 환경으로 빠르게 복귀 |

Canary Ingress에는 쿠키 기반 세션 고정을 설정해 같은 사용자가 배포 중 서로 다른 프론트엔드 버전으로 오가는 일을 줄였습니다. 백엔드는 한 시점에 하나의 활성 버전이 요청을 처리하도록 구성해, Spring Boot·JPA·MariaDB·PortOne·S3 연동이 포함된 API의 운영과 장애 분석 범위를 명확히 했습니다.

### Canary와 Blue-Green을 선택한 이유

| 대상 | 선택 이유 |
|:---|:---|
| 프론트엔드 Canary | Poticard의 디지털 명함과 포트폴리오는 레이아웃·테마·콘텐츠 표현 방식 자체가 사용자 경험에 직접 영향을 줍니다. 새 디자인이나 화면 동작을 전체에 즉시 적용하는 대신 10% 트래픽에서 먼저 제공해 UI·브라우저 호환성·번들·라우팅 문제와 실제 사용자의 반응·사용 흐름을 확인하고, 문제가 있으면 Canary 트래픽 비중을 조절해 영향 범위를 빠르게 줄일 수 있도록 구성했습니다. |
| 백엔드 Blue-Green | 결제, 파일 업로드, DB 트랜잭션 등 외부 연동이 많은 API는 여러 버전에 트래픽을 분산하기보다 한 시점에 검증된 단일 버전을 활성화하는 편이 운영과 장애 분석에 유리합니다. 비활성 색상에 새 버전을 준비한 뒤 Service selector만 전환하므로, 문제 발생 시 이전 색상으로 되돌리는 롤백 경로도 단순합니다. |

```text
GitHub Push
  ↓
Jenkins Kubernetes Pod Agent 실행
  ↓
백엔드 Gradle 빌드 / 프론트엔드 npm build
  ↓
Kaniko 이미지 빌드 및 Docker Hub Push
  ↓
kubectl로 배포 대상 Deployment 갱신
  ↓
프론트엔드: Canary에 10% 트래픽으로 검증 후 확대
백엔드: 비활성 Blue 또는 Green 환경 검증 후 Service selector 전환
```

Jenkins Pipeline은 Kubernetes Pod Agent에서 실행되며, 백엔드는 Gradle·Kaniko·kubectl 컨테이너, 프론트엔드는 Node·Kaniko·kubectl 컨테이너를 사용합니다. Kaniko로 Docker daemon 없이 이미지를 빌드·푸시하고, `kubectl rollout restart`로 배포 대상의 최신 이미지를 반영합니다.

- [프론트엔드 Canary 무중단 배포 시연](https://github.com/user-attachments/assets/d589f620-37a7-4e3c-bf93-55dfdbb35282)
- [백엔드 Blue-Green 무중단 배포 시연](https://github.com/user-attachments/assets/b66191ad-df11-4e18-be89-79c16039508d)

---

<a id="system-architecture"></a>
## 시스템 아키텍처

<img width="1920" height="991" alt="Poticard 시스템 아키텍처" src="https://github.com/user-attachments/assets/1076de02-6b7c-4f8d-959a-52e630cbcc00" />

사용자는 포트폴리오를 섹션 단위로 작성하고, 대표 이미지와 본문 이미지는 AWS S3에 저장합니다. 작성한 본문은 Gemini API를 통해 첨삭하거나 기술 스택을 추출할 수 있으며, AI 첨삭은 PortOne 결제 검증을 통과한 PRO 사용자에게만 제공합니다. 외부 요청은 Nginx Ingress를 통해 프론트엔드와 백엔드로 전달하며, 각 서비스는 Kubernetes Deployment로 운영합니다.

---

<a id="toc"></a>
## 담당 역할 및 구현 내용

- [1. 포트폴리오 관리 및 작성 경험](#portfolio-management)
  - [포트폴리오·섹션 생성 및 관리](#portfolio-section-management)
  - [Quill Editor 이미지 업로드](#quill-image-upload)
  - [AI 첨삭 및 기술 스택 추출](#ai-review-keyword-extraction)
    - [AI 분석 흐름](#ai-analysis-flow)
  - [포트폴리오 목록 조회와 스타일 설정](#portfolio-list-style)
    - [페이징 전략 성능 개선](#pagination-performance)
- [2. 결제 검증 및 PRO 권한 관리](#payment-pro)
  - [PortOne 결제 위변조 검증](#payment-verification)
    - [결제 검증 및 저장 흐름](#payment-verification-flow)
  - [PRO 요금제 권한 확인](#pro-access-control)
  - [요금제 혜택 데이터 변환](#plan-benefit-conversion)

---

<a id="portfolio-management"></a>
## 1. 포트폴리오 관리 및 작성 경험

사용자가 프로젝트 경험을 포트폴리오로 구성하고, 이를 외부에 보여 줄 수 있도록 생성·조회·수정·삭제 기능을 구현했습니다. 포트폴리오는 제목, 기간, 역할, 대표 이미지, 섹션 목록, 키워드, 테마 및 레이아웃 정보를 포함합니다.

<a id="portfolio-section-management"></a>
### 포트폴리오·섹션 생성 및 관리

포트폴리오 생성 시 요청으로 받은 섹션 목록을 `Portfolio` 엔티티와 연결해 함께 저장합니다. 삭제 시에는 인증된 사용자의 식별자와 입력한 포트폴리오 제목을 모두 확인해, 다른 사용자의 포트폴리오가 삭제되지 않도록 처리했습니다.

| 기능 | 처리 내용 |
|:---|:---|
| 포트폴리오 생성 | 대표 이미지 업로드 후 포트폴리오와 섹션 목록을 연결해 저장 |
| 상세·목록 조회 | 포트폴리오 정보와 사용자별 포트폴리오 목록 제공 |
| 스타일 수정 | 테마·레이아웃과 섹션별 노출 여부·표시 순서 변경 |
| 키워드 관리 | AI가 추출한 기술 스택을 포트폴리오 키워드로 저장하고, 사용자 전체 포트폴리오의 중복 키워드는 제거해 조회 |
| 삭제 권한 확인 | 작성자 식별자와 포트폴리오 제목을 검증한 뒤 삭제 |

```text
포트폴리오 생성 요청
  ↓
대표 이미지 S3 업로드
  ↓
Portfolio 엔티티 생성
  ↓
Section 엔티티를 Portfolio에 연결
  ↓
Portfolio·Section 저장
```

<a id="quill-image-upload"></a>
### Quill Editor 이미지 업로드

자유로운 리치 텍스트 작성 경험을 제공하기 위해 Quill Editor를 적용했습니다. 에디터의 이미지를 Base64 문자열로 본문과 함께 DB에 저장하면 데이터 용량과 조회 부하가 커질 수 있으므로, 이미지는 별도 업로드하고 본문에는 S3 URL만 저장하도록 구성했습니다.

프론트엔드는 에디터에서 선택한 이미지를 임시 주소로 관리하다가 포트폴리오를 저장하기 전에 S3에 업로드합니다. 업로드가 완료되면 본문 안의 임시 주소를 S3 URL로 치환한 뒤 포트폴리오 생성 요청을 보냅니다. 백엔드는 업로드 날짜와 UUID를 조합한 파일 경로를 생성해 파일 이름 충돌을 방지합니다.

```text
Quill Editor 이미지 선택
  ↓
임시 주소로 본문에 삽입
  ↓
포트폴리오 저장 전 이미지 S3 업로드
  ↓
본문의 임시 주소를 S3 URL로 치환
  ↓
포트폴리오 본문 저장
```

<a id="ai-review-keyword-extraction"></a>
### AI 첨삭 및 기술 스택 추출

Gemini 2.5 Flash를 활용해 포트폴리오 본문을 첨삭하고, 실제 사용한 기술 스택을 키워드로 추출하도록 구현했습니다. 두 기능은 요청 본문이 비어 있는지 먼저 확인하고, Gemini 응답 JSON은 `ObjectMapper`로 파싱해 필요한 텍스트만 반환합니다.

| 기능 | 프롬프트 제약 | 결과 처리 |
|:---|:---|:---|
| AI 첨삭 | 원문에 없는 기술이나 경험을 만들지 않고, 개발자의 기여도와 기술 역량이 드러나도록 문장 개선 | 첨삭된 본문만 반환 |
| 기술 스택 추출 | 실제 사용한 언어·프레임워크·라이브러리·DB·인프라 도구만 최대 8개 추출 | 쉼표로 구분된 응답을 `List<String>`으로 변환해 키워드 저장 |

<img width="1046" height="607" alt="image (1)" src="https://github.com/user-attachments/assets/cb329f33-69a6-4d26-8061-3949bb20fbcb" />


<a id="ai-analysis-flow"></a>
#### AI 분석 흐름

```text
포트폴리오 본문 분석 요청
  ↓
요청 내용 검증
  ↓
AI 첨삭 요청이면 최신 성공 결제 내역으로 PRO 권한 확인
  ↓
첨삭 또는 기술 스택 추출 프롬프트 구성
  ↓
RestTemplate으로 Gemini 2.5 Flash 호출
  ↓
ObjectMapper로 응답 JSON 파싱
  ↓
첨삭 문장 또는 기술 스택 목록 반환
```

AI 첨삭은 최신 성공 결제 내역의 `planCode`가 `PRO`인 사용자만 실행할 수 있도록 서비스 계층에서 한 번 더 확인했습니다. 기술 스택 추출은 추출 결과를 쉼표로 분리하고 공백·빈 값을 제거해 포트폴리오 키워드로 저장합니다.

<a id="portfolio-list-style"></a>
### 포트폴리오 목록 조회와 스타일 설정

목록 조회에는 `page`, `size` 기반 `PageRequest`를 적용해 필요한 범위의 포트폴리오만 가져옵니다. 포트폴리오를 렌더링할 때는 테마와 레이아웃 유형을 적용하고, 각 섹션의 표시 순서와 공개 여부를 개별적으로 관리합니다.

| 설정 항목 | 처리 내용 |
|:---|:---|
| 페이징 | 사용자 식별자와 `PageRequest`로 목록 조회 범위를 제한 |
| 테마 | 포트폴리오 렌더링 테마 변경 |
| 레이아웃 | 포트폴리오 레이아웃 유형 변경 |
| 섹션 | 섹션별 표시 순서와 노출 여부 변경 |

<a id="pagination-performance"></a>
#### 포트폴리오 목록 조회 성능 개선

사용자의 포트폴리오가 누적될수록 목록을 한 번에 조회하는 방식은 조회 범위와 응답 지연을 함께 증가시킵니다. 이를 개선하기 위해 PageRequest.of(page, size)를 적용해 요청한 페이지의 데이터만 조회하도록 변경했고, 목록 화면의 초기 로딩 부담을 줄였습니다.

<img width="1608" height="282" alt="image" src="https://github.com/user-attachments/assets/2aa68ffc-4b8b-4744-849c-bb19230787b5" />

<img width="1607" height="285" alt="image" src="https://github.com/user-attachments/assets/b5a41cee-089b-4290-9c45-512dea03e28f" />

사용자 100명 기준
| 구분 | MTT | TPS |
|:---|:---|:---|
| 개선 전 | 29.7ms | 65.5 |
| 페이징 처리 후 | 19.5ms | 100.9 |

페이징 적용 후 평균 응답 시간은 `29.7ms → 19.5ms`로 감소했고, TPS는 `65.5 → 100.9`로 향상됐습니다.


[목차로 돌아가기](#toc)

---

<a id="payment-pro"></a>
## 2. 결제 검증 및 PRO 권한 관리

결제 완료 정보를 그대로 신뢰하지 않고 PortOne SDK로 PG 결제 정보를 다시 조회해 금액과 결제 상태를 검증했습니다. 검증을 통과한 결제만 주문 내역으로 저장하고, 최신 성공 결제 내역을 기준으로 PRO 전용 기능의 접근 권한을 판단합니다.

<a id="payment-verification"></a>
### PortOne 결제 위변조 검증

프론트엔드는 결제 완료 후 결제 ID, 금액, 주문 번호, 요금제 코드, 이메일을 `/orders/verify`로 전달합니다. 백엔드는 PortOne `PaymentClient`로 결제 정보를 조회하고, 실제로 완료된 결제인지와 PG 결제 금액이 요청 금액과 같은지를 확인합니다. 검증에 실패한 결제는 저장하지 않습니다.

| 검증 항목 | 처리 내용 |
|:---|:---|
| 결제 상태 | PortOne 조회 결과가 완료 결제(`PaidPayment`)인지 확인 |
| 결제 금액 | PG의 실제 결제 금액과 클라이언트 전달 금액 비교 |
| 주문 저장 | 검증 성공 시에만 결제 ID·주문 번호·요금제 코드·결제자 정보와 함께 저장 |
| 위변조 대응 | 금액 불일치 또는 미완료 결제는 예외 처리하고 주문 내역을 생성하지 않음 |

<a id="payment-verification-flow"></a>
#### 결제 검증 및 저장 흐름

```text
프론트엔드 결제 완료
  ↓
/orders/verify 요청
  ↓
PaymentClient로 PortOne 결제 정보 조회
  ↓
완료 결제 여부 확인
  ↓
PG 결제 금액과 요청 금액 비교
  ↓
검증 성공 시 Orders 생성 및 paid = true 저장
  ↓
결제 성공 응답 반환
```

<a id="pro-access-control"></a>
### PRO 요금제 권한 확인

`/orders/check-pro` 요청 시 사용자의 성공 결제 내역 중 가장 최근 주문을 조회합니다. 해당 주문의 `planCode`가 `PRO`이면 `true`, 그 외에는 `false`를 반환합니다. 이 결과는 프론트엔드의 기능 노출 제어에 활용하며, AI 첨삭 서비스에서도 동일한 기준으로 PRO 권한을 재검증합니다.

```text
/orders/check-pro 요청
  ↓
사용자의 최신 성공 결제 내역 조회
  ↓
planCode가 PRO인지 확인
  ↓
true 또는 false 반환
```

<a id="plan-benefit-conversion"></a>
### 요금제 혜택 데이터 변환

요금제는 이름, 월간·연간 가격, 혜택 목록으로 관리합니다. `StringListConverter`를 적용해 DB에는 혜택 목록을 쉼표로 연결한 문자열로 저장하고, 애플리케이션에서는 `List<String>`으로 변환해 사용합니다.

| 변환 방향 | 처리 내용 |
|:---|:---|
| 저장 | `List<String>` → 쉼표로 연결한 문자열 |
| 조회 | 문자열 → 쉼표 기준으로 분리한 `List<String>` |

[목차로 돌아가기](#toc)
