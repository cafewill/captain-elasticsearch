# Elasticsearch Appender 라이브러리 스펙 비교

## 0. 원본(3.0.19) 대비 bulk-only 추가 기능 및 호환 설정

`lib/simple-lib-spring-elasticsearch-appender-bulk-only-3.0.0`은 원본인 `logback-elasticsearch-appender-3.0.19`을 기반으로 운영 편의성과 신뢰성을 높이기 위해 몇 가지 기능이 추가되고 기본값이 변경되었습니다.

### 0-1. bulk-only 추가 기능 요약
- **재큐(Requeue) 지원**: 전송 재시도 횟수 초과나 예외 발생 시, 로그를 즉시 버리지 않고 내부 큐에 다시 삽입하여 유실을 방지합니다 (`requeue-on-failure`).
- **상태 유지 전송 스레드**: 로그가 없을 때 스레드를 종료하지 않고 대기하여, 새로운 로그 발생 시 스레드 기동 지연 없이 즉시 전송합니다 (`persistent-writer-thread`).
- **개별 아이템 분석**: Bulk 응답 내의 개별 로그 항목별로 성공/실패를 분석하여, 일시적 오류(429, 5xx)가 발생한 항목만 골라 재시도합니다.
- **SSL 검증 우회**: 자가 서명 인증서를 사용하는 내부망 환경에서도 별도 설정 없이 연결이 가능합니다 (`trust-all-ssl`).

### 0-2. 원본(3.0.19)과 동일하게 동작시키기 위한 설정
bulk-only 버전을 사용하면서 원본(`3.0.19`)과 최대한 동일한 기능과 기본값으로 운영하려면 `application.properties`에 아래와 같이 설정하십시오.

```properties
# --- 원본 호환성 설정 (bulk-only 적용 시) ---

# 1. 기본 액션을 index에서 create로 변경 (원본 기본값: create)
elasticsearch.operation=create

# 2. MDC 정보 자동 포함 비활성화 (원본 기본값: false)
elasticsearch.include-mdc=false

# 3. 실패 시 큐 재삽입 기능 비활성화 (원본 미지원 기능)
elasticsearch.requeue-on-failure=false

# 4. 전송 스레드 상주 기능 비활성화 (원본은 필요 시 생성 방식)
elasticsearch.persistent-writer-thread=false

# 5. (참고) 원본은 모든 SSL 신뢰 기능을 제공하지 않으므로, 
# 엄격한 보안 검증이 필요한 경우에만 false로 설정 (기본값: true)
# elasticsearch.trust-all-ssl=false
```

## 1. Spring Boot application.properties 설정 가이드 (bulk-only 기준)

`lib/simple-lib-spring-elasticsearch-appender-bulk-only-3.0.0` 라이브러리를 다른 버전들과 동일한 수준의 기능으로 운영하기 위한 `application.properties` 설정값입니다. 이 값들은 보통 `logback-spring.xml`에서 `<springProperty>` 태그를 통해 Appender로 주입되어 사용됩니다.

```properties
# --- 기본 연결 및 인증 설정 ---
# Elasticsearch 클러스터 URL (필수)
elasticsearch.url=http://localhost:9200
# 인덱스 패턴 (필수). {date} 또는 %date{yyyy.MM.dd} 사용 가능
elasticsearch.index=logs-app-{date}
# Basic 인증 정보 (선택)
elasticsearch.username=elastic
elasticsearch.password=changeme

# --- 동작 제어 및 데이터 포함 설정 ---
# bulk 액션 타입. bulk-only 버전은 index 또는 create만 지원 (기본값: index)
elasticsearch.operation=index
# MDC(Mapped Diagnostic Context) 포함 여부 (기본값: true)
elasticsearch.include-mdc=true
# KeyValuePair(StructuredArguments) 포함 여부 (기본값: false)
elasticsearch.include-kvp=true
# 호출자 정보(클래스, 메서드, 라인) 포함 여부 - 성능 영향 있음 (기본값: false)
elasticsearch.include-caller-data=false
# logstash-logback-encoder의 StructuredArguments 추출 여부 (기본값: false)
elasticsearch.include-structured-args=true

# --- 신뢰성 및 성능 최적화 ---
# 메모리 큐의 최대 크기 (바이트 단위, 약 20만건 수준)
elasticsearch.max-queue-size=104857600
# 한 번의 bulk 요청에 담을 최대 로그 수 (-1은 제한 없음, 큐를 즉시 비움)
elasticsearch.max-batch-size=200
# 큐를 확인하는 주기 및 재시도 간격 (ms, 기본값: 250)
elasticsearch.sleep-time=250
# 전송 실패 시 재시도 횟수 (기본값: 3)
elasticsearch.max-retries=3
# 최종 실패 시 로그를 유실하지 않고 큐에 재삽입 (bulk-only 전용, 기본값: true)
elasticsearch.requeue-on-failure=true
# 큐가 비어있어도 전송 스레드를 유지하여 지연 최소화 (기본값: true)
elasticsearch.persistent-writer-thread=true

# --- 네트워크 및 보안 ---
# 연결 타임아웃 (ms, 기본값: 30000)
elasticsearch.connect-timeout=5000
# 읽기 타임아웃 (ms, 기본값: 30000)
elasticsearch.read-timeout=30000
# 모든 SSL 인증서 허용 (자가 서명 인증서 환경 대응, 기본값: true)
elasticsearch.trust-all-ssl=true

# --- 페이로드 커스터마이징 ---
# 추가 속성 필드명 앞에 붙을 접두사 (기본값: "")
elasticsearch.key-prefix=
# 메시지 최대 길이 제한 (-1은 제한 없음)
elasticsearch.max-message-size=-1
# 메시지가 JSON 문자열인 경우 파싱하여 객체로 저장 (기본값: false)
elasticsearch.raw-json-message=false
# MDC/KVP 내 객체 직렬화 시 Jackson 모듈 사용 여부 (기본값: false)
elasticsearch.object-serialization=false
# 특정 레벨 이상 로그에 대해 스택트레이스 자동 생성 (기본값: OFF)
elasticsearch.auto-stack-trace-level=OFF
```

---

## 1. 요약 비교

- 원본: `lib/logback-elasticsearch-appender-3.0.19`
- 원본 동일 기능 커스터마이징: `lib/simple-lib-spring-elasticsearch-appender-3.0.0`
- 로그 모니터링 전용 bulk-only 구현: `lib/simple-lib-spring-elasticsearch-appender-bulk-only-3.0.0`

## 1. 요약 비교

| 항목 | logback-elasticsearch-appender 3.0.19 | simple-lib-spring-elasticsearch-appender 3.0.0 | simple-lib-spring-elasticsearch-appender-bulk-only 3.0.0 |
|---|---|---|---|
| 목적 | Logback 이벤트를 Elasticsearch `_bulk` API로 전송하는 원본 | 원본 기능을 Elasticsearch 명칭과 패키지로 커스터마이징 | 프로젝트 로그 모니터링 전용으로 bulk index/create 중심 동작 보강 |
| 대표 Appender | `ElasticsearchAppender`, `ElasticsearchAccessAppender`, `StructuredArgsElasticsearchAppender` | `ElasticsearchAppender`, `StructuredArgsElasticsearchAppender` | `ElasticsearchAppender`, `StructuredArgsElasticsearchAppender` |
| 전송 API | 설정한 `url`로 POST. 일반적으로 `/_bulk` URL 지정 필요 | `url` 끝에 `/_bulk`가 없으면 자동 추가 | `url` 끝에 `/_bulk`가 없으면 자동 추가 |
| 기본 operation | `create` | `create` | `index` |
| 허용 operation | `index`, `create`, `update`, `delete` | `index`, `create`, `update`, `delete` | `index`, `create` |
| bulk 응답 item별 분석 | 응답 코드 200이면 성공 처리, item별 partial failure 분석 없음 | `errors=true` 응답의 item별 상태 분석 | `errors=true` 응답의 item별 상태 분석 |
| 재시도 기준 | 전송 실패 또는 pending buffer가 남은 경우 반복 | HTTP 429/5xx, bulk item 429/5xx는 재시도 | HTTP 429/5xx, bulk item 429/5xx는 재시도 |
| 재큐 | 없음 | 없음 | 있음. `requeueOnFailure=true`일 때 재시도 초과/중단/예외 항목을 내부 큐에 재삽입 |
| 4xx 처리 | HTTP 4xx는 버퍼를 비우고 drop | HTTP 4xx 또는 item 4xx는 fatal 처리 후 drop | HTTP 4xx 또는 item 4xx는 fatal 처리 후 drop |
| 큐 구조 | 문자열 전송 버퍼. `maxQueueSize`는 문자 길이 기준 | `ArrayBlockingQueue<ILoggingEvent>`. capacity는 `maxQueueSize / 512`, 최소 100건 | `ArrayBlockingQueue<ILoggingEvent>`. capacity는 `maxQueueSize / 512`, 최소 100건 |
| writer thread | 이벤트 발생 시 writer thread 시작, idle 시 종료 | 기본 false: 원본 호환. true: daemon writer thread 유지 | 기본 true: daemon writer thread 유지 |
| SSL trust-all | 없음 | 있음. 기본 true | 있음. 기본 true |
| Basic 인증 | 있음 | 있음 | 있음 |
| 커스텀 헤더 | 있음 | 있음 | 있음 |
| MDC 포함 | 지원. 기본 false | 지원. 기본 true | 지원. 기본 true |
| SLF4J key-value 포함 | 지원. 기본 false | 지원. 기본 false | 지원. 기본 false |
| StructuredArguments | 지원 | 지원. 클래스패스에 `logstash-logback-encoder`가 없으면 structured args만 무시 | 지원. 클래스패스에 `logstash-logback-encoder`가 없으면 structured args만 무시 |
| caller data | 지원. 기본 false | 지원. 기본 false | 지원. 기본 false |
| raw JSON message | 지원. 기본 false | 지원. 기본 false | 지원. 기본 false |
| auto stack trace | 지원. 기본 OFF | 지원. 기본 OFF | 지원. 기본 OFF |
| Elasticsearch 2.x/3.x 로그 모니터링 적합성 | 원본은 Elasticsearch 명칭과 create 기본값 중심 | Elasticsearch 명칭으로 이식했지만 update/delete도 허용 | 이 프로젝트 권장. bulk index 기본, partial failure 재시도, 재큐 지원 |

## 2. 기능별 상세 비교

### 2-1. Bulk 전송

| 기능 | 원본 3.0.19 | simple 3.0.0 | bulk-only 3.0.0 |
|---|---|---|---|
| payload 형식 | NDJSON. action line + document line 반복 | NDJSON. action line + document line 반복 | NDJSON. action line + document line 반복 |
| endpoint | `url` 값을 그대로 사용 | `url`이 `/_bulk`로 끝나지 않으면 `/_bulk` 자동 추가 | `url`이 `/_bulk`로 끝나지 않으면 `/_bulk` 자동 추가 |
| 성공 판단 | HTTP 200이면 성공 | HTTP 2xx + bulk response `errors=false`이면 성공 | HTTP 2xx + bulk response `errors=false`이면 성공 |
| HTTP 429/5xx | 재시도 대상 | 재시도 대상 | 재시도 대상 |
| HTTP 4xx | 버퍼 삭제 후 실패 로그 | fatal 실패, 재시도 없음 | fatal 실패, 재시도 없음 |
| item 429/5xx | 별도 분석 없음 | 해당 item만 재시도 | 해당 item만 재시도 |
| item 4xx | 별도 분석 없음 | fatal 실패 메시지로 기록, 재시도 없음 | fatal 실패 메시지로 기록, 재시도 없음 |

### 2-2. Operation

| operation | 원본 3.0.19 | simple 3.0.0 | bulk-only 3.0.0 | 설명 |
|---|---|---|---|---|
| `index` | 지원 | 지원 | 지원 | 같은 `_id`가 있으면 덮어쓸 수 있는 bulk index 작업. 현재 프로젝트 로그 적재 기본 방식 |
| `create` | 지원, 기본값 | 지원, 기본값 | 지원 | 같은 `_id`가 있으면 version conflict가 날 수 있는 생성 전용 작업 |
| `update` | 지원 | 지원 | 미지원 | 로그 신규 적재용으로는 부적합. bulk-only에서는 설정 시 `index`로 대체 |
| `delete` | 지원 | 지원 | 미지원 | 로그 신규 적재용으로는 부적합. bulk-only에서는 설정 시 `index`로 대체 |
| 잘못된 값 | 경고 후 `create` 사용 | 경고 후 `create` 사용 | 경고 후 `index` 사용 | 빈 값도 같은 기본값으로 대체 |

## 3. 설정값 비교

단위 표기:

- `ms`: millisecond. 1000 ms = 1 sec
- `byte`: 바이트. 1024 byte = 1 KB, 1048576 byte = 1 MB
- `char`: Java `StringBuilder.length()` 기준 문자 수
- `event`: Logback `ILoggingEvent` 1건

### 3-1. 연결/인증 설정

| 설정값 | 단위/타입 | 원본 기본값 | simple 기본값 | bulk-only 기본값 | 기능 및 변경 시 동작 | 초과/오류 시 동작 |
|---|---:|---:|---:|---:|---|---|
| `url` | URL/String | 없음 | 없음 | 없음 | 전송 대상 URL. 원본은 값을 그대로 사용하고, simple/bulk-only는 `/_bulk`가 없으면 자동 추가 | 비어 있으면 simple/bulk-only는 appender 시작 실패. 원본은 출력 writer가 생성되지 않거나 URL 설정 오류 발생 |
| `index` | String | 없음 | 없음 | 없음 | bulk action의 `_index`. `%date{yyyy.MM.dd}` 또는 `{date}` 패턴으로 일자 치환 가능 | 비어 있으면 simple/bulk-only는 appender 시작 실패 |
| `type` | String | 없음 | 없음 | 없음 | bulk action metadata의 `_type`. Elasticsearch 2.x/3.x에서는 일반적으로 사용하지 않음 | 값이 있으면 그대로 `_type`에 포함 |
| `authentication` | Object | 없음 | 없음 | 없음 | Basic/AWS 등 인증 헤더 추가. simple/bulk-only는 `ElasticsearchBasicAuthentication` 제공 | 인증 실패는 보통 HTTP 401/403. 원본은 4xx에서 버퍼 drop, simple/bulk-only는 fatal 처리 |
| `headers` | Object list | 없음 | 없음 | 없음 | 커스텀 HTTP 헤더 추가. 원본은 `Content-Encoding: gzip` 지정 시 gzip 전송 | 잘못된 헤더명/빈 이름은 simple/bulk-only에서 무시 |
| `connectTimeout` | ms | 30000 ms = 30 sec | 30000 ms = 30 sec | 30000 ms = 30 sec | TCP 연결 대기 시간. 작게 하면 장애 감지가 빠르고, 크게 하면 느린 네트워크를 더 기다림 | 시간 초과 시 전송 예외. 재시도 대상 |
| `readTimeout` | ms | 30000 ms = 30 sec | 30000 ms = 30 sec | 30000 ms = 30 sec | 응답 읽기 대기 시간. 큰 bulk나 느린 Elasticsearch에서는 늘릴 수 있음 | 시간 초과 시 전송 예외. 재시도 대상 |
| `trustAllSsl` | boolean | 미지원 | `true` | `true` | 자가 서명 인증서와 hostname 검증 우회. 프라이빗 클라우드 테스트용 | `false`에서 인증서 검증 실패 시 전송 예외. 재시도 대상 |

### 3-2. 큐/배치/전송 주기 설정

| 설정값 | 단위/타입 | 원본 기본값 | simple 기본값 | bulk-only 기본값 | 기능 및 변경 시 동작 | 초과/오류 시 동작 |
|---|---:|---:|---:|---:|---|---|
| `sleepTime` | ms | 250 ms | 250 ms | 250 ms | writer loop 대기/flush/retry 간격. 낮추면 지연은 줄고 CPU/전송 빈도는 증가 | 원본/simple/bulk-only 모두 100 ms 미만이면 100 ms로 보정 |
| `maxRetries` | count | 3 | 3 | 3 | 실패 전송 재시도 횟수. 실제 시도는 최초 1회 + 재시도 N회 | simple/bulk-only는 음수 입력 시 0으로 보정. 재시도 초과 시 simple은 drop, bulk-only는 설정에 따라 재큐 |
| `maxQueueSize` | 원본: char, simple/bulk-only: byte 환산값 | 104857600 = 100 MB 수준 | 104857600 = 100 MB, capacity 약 204800 event | 104857600 = 100 MB, capacity 약 204800 event | 원본은 전송 문자열 버퍼 최대 길이. simple/bulk-only는 `maxQueueSize / 512`로 event queue capacity 계산, 최소 100 event | 원본은 초과 후 버퍼가 비워질 때까지 신규 로그 유실. simple/bulk-only는 queue full이면 해당 event drop |
| `maxBatchSize` | event | -1 = 무제한 | -1 = 무제한 | -1 = 무제한 | 한 번의 bulk payload에 담을 최대 event 수. 양수면 해당 수 이상 모이면 flush | -1 또는 0 이하면 건수 제한 없음. 너무 크게 잡으면 payload와 메모리 사용 증가 |
| `persistentWriterThread` | boolean | 미지원 | `false` | `true` | true면 appender 생명주기 동안 daemon writer thread 유지. false면 이벤트 발생 시 thread 시작 후 idle 종료 | false에서 이벤트가 다시 들어오면 writer thread를 재기동 |
| `requeueOnFailure` | boolean | 미지원 | 미지원 | `true` | 재시도 초과/중단/예외 발생 시 실패 item을 내부 큐에 다시 넣음 | 재큐 시 큐가 가득 차면 재삽입 실패 event는 drop |

### 3-3. 메시지/필드 구성 설정

| 설정값 | 단위/타입 | 원본 기본값 | simple 기본값 | bulk-only 기본값 | 기능 및 변경 시 동작 | 초과/오류 시 동작 |
|---|---:|---:|---:|---:|---|---|
| `includeMdc` | boolean | `false` | `true` | `true` | MDC map을 Elasticsearch 문서 필드로 추가 | simple/bulk-only는 `@timestamp`, `level`, `thread`, `logger`, `message` 같은 고정 필드 충돌 키를 무시 |
| `includeKvp` | boolean | `false` | `false` | `false` | SLF4J 2 key-value pair를 문서 필드로 추가 | null pair, 빈 key, 고정 필드 충돌 key는 simple/bulk-only에서 무시 |
| `includeCallerData` | boolean | `false` | `false` | `false` | caller class/method/file/line 추가. 호출 위치 계산 비용 증가 | caller data가 없으면 필드 미추가 |
| `rawJsonMessage` | boolean | `false` | `false` | `false` | true면 message를 JSON으로 파싱해 object/array로 저장 시도 | 파싱 실패 시 simple/bulk-only는 문자열 message로 저장 |
| `maxMessageSize` | char | -1 = 무제한 | -1 = 무제한 | -1 = 무제한 | message 최대 길이. 양수면 해당 문자 수까지만 보존 | 초과 시 앞부분 `N` char + `..`로 truncate |
| `timestampFormat` | String | 기본 `yyyy-MM-dd'T'HH:mm:ss.SSSZ`; `long` 가능 | 기본 ISO offset date-time, JVM 기본 timezone; `long` 가능 | 기본 ISO offset date-time, JVM 기본 timezone; `long` 가능 | 날짜 포맷 문자열 지정. `long`이면 epoch millis 숫자로 저장 | 잘못된 패턴은 이벤트 직렬화 중 예외 가능 |
| `keyPrefix` | String | 없음 | `""` | `""` | StructuredArguments 필드명 앞에 prefix 추가 | null이면 빈 문자열 처리 |
| `objectSerialization` | boolean | `false` | `false` | `false` | 객체 값을 Jackson tree로 직렬화. true면 Java time 등 모듈 등록 | 직렬화 불가 객체는 Jackson 예외 가능 |
| `includeStructuredArgs` | boolean | Appender 유형으로 제공 | `false` | `false` | true면 logstash `ObjectAppendingMarker` 인자를 필드화 | 관련 클래스가 classpath에 없으면 structured args만 무시 |
| `autoStackTraceLevel` | Logback level | `OFF` | `OFF` | `OFF` | 지정 레벨 이상 로그에 예외가 없어도 stack trace 자동 생성 | 잘못된 level은 Logback `Level.toLevel` 기준으로 `OFF` 처리 |
| `properties` | Object list | 없음 | 없음 | 없음 | PatternLayout 표현식 기반 고정/파생 필드 추가 | `allowEmpty=false`인데 결과가 blank면 필드 미추가. 숫자 변환 실패 시 해당 숫자 필드 미추가 |
| `loggerName` | String | 없음 | 없음 | 없음 | bulk payload를 지정 logger로 mirror 출력 | logger 미설정 시 출력 없음 |
| `errorLoggerName` | String | 없음 | 없음 | 없음 | 전송 실패/예외를 지정 logger로 출력 | logger 미설정 시 출력 없음 |
| `logsToStderr` | boolean | `false` | `false` | `false` | bulk payload를 stderr로 출력 | 운영에서는 payload 노출 위험 |
| `errorsToStderr` | boolean | `false` | `false` | `false` | 전송 오류를 stderr로 출력 | 운영 stderr 로그 증가 |

## 4. 장애/한도 초과 시 동작

| 상황 | 원본 3.0.19 | simple 3.0.0 | bulk-only 3.0.0 |
|---|---|---|---|
| Elasticsearch 연결 실패 | send buffer 유지 후 `maxRetries`까지 재시도. 초과 시 writer 종료 가능 | 현재 batch를 `maxRetries`만큼 재시도 후 drop | 현재 batch를 `maxRetries`만큼 재시도 후 `requeueOnFailure=true`면 큐에 재삽입 |
| HTTP 429 또는 5xx | 재시도 | 재시도 | 재시도 |
| HTTP 400~499 | send buffer 삭제 후 drop | fatal 처리 후 drop | fatal 처리 후 drop |
| bulk response item 일부 429/5xx | HTTP 200이면 성공으로 간주할 수 있음 | 실패 item만 재시도 | 실패 item만 재시도 |
| bulk response item 일부 400~499 | HTTP 200이면 성공으로 간주할 수 있음 | fatal 메시지 기록 후 해당 item drop | fatal 메시지 기록 후 해당 item drop |
| 큐/버퍼 초과 | `maxQueueSize` 이상이면 버퍼가 비워질 때까지 신규 로그 유실 | 내부 event queue full이면 신규 event drop | 내부 event queue full이면 신규 event drop. 재큐도 queue full이면 drop |
| message 길이 초과 | `maxMessageSize > 0`이면 truncate | `maxMessageSize > 0`이면 truncate | `maxMessageSize > 0`이면 truncate |
| `sleepTime < 100` | 100 ms로 보정 | 100 ms로 보정 | 100 ms로 보정 |
| `maxQueueSize <= 0` | 코드상 그대로 설정될 수 있어 비권장 | 104857600 byte 기본값으로 보정 | 104857600 byte 기본값으로 보정 |
| 잘못된 operation | `create`로 대체 | `create`로 대체 | `index`로 대체 |

## 5. 권장 선택 기준

| 사용 목적 | 권장 라이브러리 | 이유 |
|---|---|---|
| 원본 동작 검증 또는 레퍼런스 확인 | `lib/logback-elasticsearch-appender-3.0.19` | upstream 기능 기준점 |
| 원본과 최대한 동일한 Elasticsearch 명칭 커스터마이징 검증 | `lib/simple-lib-spring-elasticsearch-appender-3.0.0` | create/update/delete 포함 원본 operation 범위 유지 |
| 프로젝트 로그 모니터링 운영 예제 | `lib/simple-lib-spring-elasticsearch-appender-bulk-only-3.0.0` | bulk `index` 기본, partial failure 분석, retry, 재큐, persistent writer 기본값 제공 |

