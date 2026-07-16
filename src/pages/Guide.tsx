import { Link } from 'react-router-dom';

export default function Guide() {
  return (
    <div className="guide">
      <h1 className="page-title">사용자 가이드</h1>

      <div className="card">
        <h2 className="card-title">1. 시작하기 — API 키 발급 (무료, 1분 소요)</h2>
        <ol className="guide-steps">
          <li>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio (aistudio.google.com/apikey)
            </a>
            에 구글 계정으로 로그인합니다.
          </li>
          <li><strong>"API 키 만들기"</strong> 버튼을 눌러 키를 발급받습니다. (신용카드 불필요)</li>
          <li>발급된 키(AIza…)를 복사합니다.</li>
          <li>
            이 앱의 <Link to="/settings">설정</Link> 메뉴에서 키를 붙여넣고 <strong>저장</strong> →{' '}
            <strong>연결 테스트</strong>를 누릅니다.
          </li>
        </ol>
        <p className="field-hint">
          Gemini 무료 등급은 하루 수백 회 요청이 가능해 개인 사용에는 충분합니다. 키는 이 기기에만
          저장됩니다.
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">2. 문제 생성하기</h2>
        <ol className="guide-steps">
          <li><Link to="/generate">문제 생성</Link> 메뉴로 이동합니다.</li>
          <li><strong>학년</strong>(중1~고3)을 선택하면 해당 학년의 교육과정 단원이 표시됩니다.</li>
          <li><strong>단원/주제</strong>를 고르거나 "직접 입력"으로 원하는 주제를 적습니다.</li>
          <li>
            <strong>문제 유형</strong>을 선택합니다 — 객관식(5지선다), 단답형, 서술형, OX형을 복수
            선택하면 골고루 섞여 출제됩니다.
          </li>
          <li>
            <strong>난이도별 문항 수</strong>를 정합니다 — 하/중/상을 섞어 최대 30문항까지 한 번에
            출제할 수 있습니다. (예: 하 3 · 중 5 · 상 2)
          </li>
          <li><strong>시험명</strong>을 입력하면 인쇄 시 시험지 머리글에 표시됩니다. (선택)</li>
          <li><strong>문항 생성하기</strong> 버튼을 누르고 잠시 기다립니다. (난이도별로 나눠 생성)</li>
        </ol>
      </div>

      <div className="card">
        <h2 className="card-title">3. 결과 활용하기</h2>
        <ul className="guide-steps">
          <li><strong>정답/풀이 보기</strong> — 정답과 상세 풀이를 토글로 표시합니다.</li>
          <li>
            <strong>문제지 / 해설지 인쇄</strong> — 문제지 인쇄는 정답 없이 학생용으로, 해설지
            인쇄는 정답·풀이가 포함된 교사용으로 출력됩니다. <em>2단 인쇄</em>를 켜면 실제 시험지처럼
            2단으로 배치되며, 머리글에는 학원명(설정에서 입력)·시험명·이름/날짜/점수 기입란이
            인쇄됩니다.
          </li>
          <li>
            <strong>문제 다듬기</strong> — 각 문제의 ✏️(직접 수정), 🔄(AI로 새 문제 교체),
            ↑↓(순서 이동), 🗑(삭제) 도구로 시험지를 완성합니다. 배점은 100점 만점 기준으로 자동
            배분되며 ✏️수정에서 문항별로 바꿀 수 있습니다.
          </li>
          <li>
            <strong>문제 은행</strong> — 생성 기록에서 여러 세트의 문제를 체크박스로 골라 모아
            새 시험지로 구성할 수 있습니다.
          </li>
          <li><strong>이메일로 보내기</strong> — 기기의 기본 메일 앱이 열리며 문제가 본문에 채워집니다. 현재 정답이 표시된 상태면 정답/풀이도 함께 담기고, 숨긴 상태면 문제만 담깁니다. 내용이 길면 자동으로 클립보드에 복사되니 본문에 붙여넣기 하세요.</li>
          <li><strong>Excel 내보내기</strong> — <em>문제만</em> / <em>답만</em> / <em>문제 + 답</em> 중 선택해 .xlsx 파일로 저장합니다. 문제지·답안지를 따로 만들거나 문제 은행을 관리할 때 유용합니다.</li>
          <li>
            <strong>유사 문제 만들기</strong> — 문제 왼쪽 체크박스로 원하는 문제를 선택하고 생성
            개수(1~10)를 정하면, 선택한 문제의 개념·유형은 유지한 채 숫자와 식을 무작위로 바꾼 변형
            문제를 새로 만듭니다. 잘 나온 문제로 여러 벌의 문제지를 만들 때 유용합니다.
          </li>
          <li>생성된 문제는 자동으로 <Link to="/history">생성 기록</Link>에 저장되어 나중에 다시 볼 수 있습니다.</li>
          <li><Link to="/">대시보드</Link>에서 지금까지의 생성 통계를 확인할 수 있습니다.</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="card-title">4. AI 제공자 비교 — 무엇을 쓸까?</h2>
        <div className="table-wrap">
          <table className="guide-table">
            <thead>
              <tr>
                <th>제공자</th>
                <th>비용</th>
                <th>수학 품질</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Google Gemini</strong> (기본)</td>
                <td>무료 등급 제공</td>
                <td>★★★★</td>
                <td>카드 등록 불필요. 개인 사용 최적</td>
              </tr>
              <tr>
                <td>Groq (Llama 등)</td>
                <td>무료 등급 제공</td>
                <td>★★★</td>
                <td>매우 빠름. OpenAI 호환 설정으로 사용</td>
              </tr>
              <tr>
                <td>OpenRouter</td>
                <td>일부 모델 무료</td>
                <td>모델별 상이</td>
                <td>여러 회사 모델을 한 키로 사용</td>
              </tr>
              <tr>
                <td>Ollama (로컬)</td>
                <td>완전 무료</td>
                <td>★★~★★★</td>
                <td>인터넷/키 불필요. 내 PC에서 실행 (GPU 권장)</td>
              </tr>
              <tr>
                <td>Claude / OpenAI API</td>
                <td>유료 (종량제)</td>
                <td>★★★★★</td>
                <td>수학 정확도 최고. 대량 출제·상용 서비스에 권장</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="field-hint">
          Gemini 외 제공자는 <Link to="/settings">설정 → OpenAI 호환 API</Link>에서 Base URL·키·모델명만
          바꾸면 됩니다.
        </p>
      </div>

      <div className="card">
        <h2 className="card-title">5. 자주 묻는 질문</h2>
        <p><strong>Q. 생성된 문제의 정답이 틀릴 수 있나요?</strong></p>
        <p className="muted">
          네, AI 특성상 드물게 계산 오류가 있을 수 있습니다. 풀이 과정을 함께 제공하므로 배포 전
          검토를 권장합니다. 난이도 '상' 문제일수록 검토가 중요합니다.
        </p>
        <p><strong>Q. 데이터는 어디에 저장되나요?</strong></p>
        <p className="muted">
          모든 데이터(API 키, 생성 기록)는 이 기기의 브라우저에만 저장됩니다. 브라우저 데이터를
          삭제하면 기록도 사라지니, <Link to="/settings">설정 → 데이터 백업</Link>에서 JSON 파일로
          정기적으로 백업해 두세요. 백업 파일은 다른 기기·브라우저에서 "백업 가져오기"로 복원할 수
          있습니다.
        </p>
        <p><strong>Q. 무료 한도를 초과하면?</strong></p>
        <p className="muted">
          "사용량 한도 초과" 오류가 표시됩니다. 잠시 후 다시 시도하거나, 설정에서 다른 무료
          제공자(Groq, Ollama)로 전환하세요.
        </p>
      </div>
    </div>
  );
}
