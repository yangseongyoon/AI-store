const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;

  try {
    const formattedMessages = messages.map(m => {
      const role = m.role === 'ai' ? 'assistant' : 'user';
      if (m.image) {
        return {
          role,
          content: [
            ...(m.text ? [{ type: 'text', text: m.text }] : []),
            { type: 'image_url', image_url: { url: m.image } }
          ]
        };
      }
      return { role, content: m.text || '' };
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 AppForge의 AI 앱 개발자입니다. 사용자가 앱 아이디어를 말하면 즉시 실제로 동작하는 앱을 만들어주세요.

사용자가 앱을 요청하면 (만들어줘, 만들고 싶어, 만들어봐 등):
1. 앱 소개를 한국어로 1-2문장 작성
2. 아래 형식으로 완전한 HTML 코드 생성
3. APP_DATA 메타데이터 추가

코드 형식:
\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>앱이름</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0f;color:white;font-family:-apple-system,sans-serif;max-width:390px;margin:0 auto;min-height:100vh;padding:20px}
</style>
</head>
<body>
<!-- 실제 동작하는 앱 -->
<script>/* 실제 동작하는 JS */</script>
</body>
</html>
\`\`\`

APP_DATA:{"appName":"앱이름","appIcon":"이모지","appDescription":"설명","hasApp":true}

규칙:
- 요청받은 앱을 정확히 만들 것 (To do list 요청 -> To do list 생성)
- 완전한 standalone HTML
- 한국어 UI, 다크 테마
- localStorage로 데이터 저장
- 모든 기능이 실제로 동작할 것

이미지 첨부시: 이미지를 분석해서 관련 앱 제안 또는 요청에 활용
일반 대화(인사 등)는 코드 없이 한국어로 짧게 답변`
        },
        ...formattedMessages
      ],
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;

    const codeMatch = content.match(/```html\n([\s\S]*?)\n```/);
    const appCode = codeMatch ? codeMatch[1] : null;

    const dataMatch = content.match(/APP_DATA:\s*(\{[^}]+\})/);
    let appData = null;
    if (dataMatch) {
      try { appData = JSON.parse(dataMatch[1]); } catch (e) {}
    }
    if (!appData && appCode) {
      appData = { appName: "새 앱", appIcon: "✨", appDescription: "AI가 만든 앱", hasApp: true };
    }

    const cleanContent = (content
      .replace(/```html\n[\s\S]*?\n```/, '')
      .replace(/APP_DATA:\s*\{[^}]+\}/, '')
      .trim()) || (appCode ? "앱을 만들었어요! 실행 버튼을 눌러보세요." : "");

    res.json({ content: cleanContent, appData, appCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
