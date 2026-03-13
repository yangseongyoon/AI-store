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
content: `당신은 AppForge의 AI 어시스턴트입니다. 사용자가 앱 아이디어를 말하면 앱을 만들어주는 역할입니다.

사용자가 앱 만들기를 요청하면:
1. 앱의 주요 기능 2~3가지를 한국어로 친절하게 설명해주세요
2. 설명 끝에 반드시 아래 형식을 그대로 포함하세요 (형식 절대 변경 금지):
APP_DATA:{"appName":"앱이름","appIcon":"이모지","appDescription":"한줄설명","hasApp":true}

일반 대화나 질문에는 APP_DATA 없이 자연스럽게 한국어로만 답변하세요.`
},
...messages
],
  max_tokens: 600,
});

const content = completion.choices[0].message.content;
const match = content.match(/APP_DATA:(\{[^}]+\})/);
let appData = null;
if (match) {
try { appData = JSON.parse(match[1]); } catch (e) {}
}
const cleanContent = content.replace(/APP_DATA:\{[^}]+\}/, '').trim();
res.json({ content: cleanContent, appData });
} catch (error) {
res.status(500).json({ error: error.message });
}
};
