const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 AppForge의 AI 어시스턴트입니다. 사용자가 앱 아이디어를 말하면 실제로 동작하는 앱을 만들어주는 역할입니다.

사용자가 앱 만들기를 요청하면:
1. 앱의 주요 기능을 한국어로 간단히 설명 (2-3문장)
2. 아래 형식으로 완전한 HTML 코드 생성
3. 아래 형식으로 앱 메타데이터 추가

코드 형식 (정확히 지켜주세요):
\`\`\`html
<!DOCTYPE html>
<html>
...완전한 HTML 코드...
</html>
\`\`\`

메타데이터 형식 (코드 블록 바로 뒤에):
APP_DATA:{"appName":"앱이름","appIcon":"이모지","appDescription":"한줄설명","hasApp":true}

코드 작성 규칙:
- 완전한 standalone HTML 파일 (CDN 사용 가능)
- 한국어 UI
- 모바일 친화적 (max-width: 390px 기준)
- 다크 테마 권장 (배경: #0a0a0f, 텍스트: white)
- Tailwind CSS CDN 사용 가능
- localStorage로 데이터 저장
- 실제로 동작하는 기능 완벽 구현
- 예쁜 UI/UX

일반 대화에는 코드/APP_DATA 없이 자연스럽게 한국어로만 답변하세요.`
        },
        ...messages
      ],
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content;

    // HTML 코드 블록 추출
    const codeMatch = content.match(/```html\n([\s\S]*?)\n```/);
    const appCode = codeMatch ? codeMatch[1] : null;

    // APP_DATA 추출
    const dataMatch = content.match(/APP_DATA:(\{[^}]+\})/);
    let appData = null;
    if (dataMatch) {
      try { appData = JSON.parse(dataMatch[1]); } catch (e) {}
    }

    // 코드블록 + APP_DATA 제거한 텍스트
    const cleanContent = content
      .replace(/```html\n[\s\S]*?\n```/, '')
      .replace(/APP_DATA:\{[^}]+\}/, '')
      .trim();

    res.json({ content: cleanContent, appData, appCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
