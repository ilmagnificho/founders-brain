# YC Startup School Transcripts

이 폴더에 YouTube 영상의 스크립트를 저장하세요.

---

## 🚀 간단한 3단계

### Step 1: TXT 파일 만들기

**옵션 A: YouTube 설명 그대로 붙여넣기** ✨
```
---
The Startup Playbook for Hiring Your First Engineers and AEs

Most founders think hiring is about interviewing. But it's actually about selling.

For Startup School, Juicebox co-founder & CEO David Paffenholz joins YC's Harj Taggar to share how early-stage founders can find, pitch, and close top engineering and sales talent.
---
0:00
Today we're going to hear from David...
0:07
is an AI sourcing platform backed by...
```

**옵션 B: 구조화된 형식**
```
---
video_id: 3-eE4v2rMHs
title: Hiring Your First Engineers
speaker: David Paffenholz
description: Learn how to hire engineers
---
0:00
Today we're going to hear from...
```

### Step 2: 변환
```bash
npm run convert
```

### Step 3: Ingestion
```bash
npm run ingest:files
```

---

## � 팁

- **첫 줄** = 영상 제목으로 인식
- **나머지** = 영상 설명으로 저장
- **speaker 이름** = 설명에서 자동 추출 시도
- **video_id** = 변환 후 JSON에서 추가 가능
- 헤더 없이 스크립트만 넣어도 OK!
