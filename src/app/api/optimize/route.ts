import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '缺少有效的提示词' },
        { status: 400 }
      );
    }

    // 在服务器端读取环境变量
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY 未配置。请检查：\n1. 本地开发：项目根目录的 .env 文件中是否设置了 NEXT_PUBLIC_DEEPSEEK_API_KEY\n2. Vercel部署：Vercel环境变量中是否设置了 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的AI提示词优化专家。请对用户提供的提示词进行优化，确保提示词能够引导AI模型生成高质量的回答。具体要求如下：

1. 阅读用户输入的待优化提示词，然后依次用以下RABPOC元素组合成优化后的提示词：

Role——根据问题领域，AI应扮演的专家角色，以"你是"开头；

Audience——最有可能被问题困扰的人群角色，以"我是"开头；

Behavior——用户想要AI采取的表面上的行动，请使用用户输入的原文内容，仅对原文内容进行语句通顺性的微调，不要遗漏原文中的任何要点；

Purpose——用户希望通过AI采取行动背后要达成的目的，以"我想"开头；

Output——最有效的内容输出格式，通常是markdown格式，以"输出格式"开头；

Concern——用户最可能担心的风险，以"我担心"开头。

2. 示例：
- 输入："请问'氛围编程'这个词最初是谁在什么时候提出的"
- 期望："你是AI辅助软件开发专家，我是软件开发者。请问'氛围编程'这个词最初是谁在什么时候提出的？我想了解氛围编程的起源。输出格式为markdown。我担心你给出的内容不够准确，没有可供查验的网页链接。"

3. 请直接返回优化后的文本，不要添加任何解释或额外内容。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`DeepSeek API 请求失败: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0]?.message?.content;

    if (!optimizedPrompt) {
      throw new Error('DeepSeek API 返回了无效的响应');
    }

    return NextResponse.json({ optimizedPrompt });
  } catch (error) {
    console.error('API优化错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误发生' },
      { status: 500 }
    );
  }
}