'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [optimizationType, setOptimizationType] = useState<'basic' | 'deepseek'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleOptimize = async (type: 'basic' | 'deepseek' = 'basic') => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setError('');
    setOptimizationType(type);
    
    try {
      let optimized: string;
      
      if (type === 'basic') {
        // 基础优化：查询常识优化
        const prefix = "你是专家";
        const suffix = "请提供主要观点的3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造";
        optimized = `${prefix} ${userInput.trim()}，${suffix}`;
      } else {
        // DeepSeek优化：应对未知与复杂问题优化
        optimized = await callDeepSeekAPI(userInput.trim());
      }
      
      setOptimizedPrompt(optimized);
      setUserInput('');
      
      // 平滑滚动到结果区域
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误发生';
      setError(errorMessage);
      
      // 10秒后自动清除错误信息
      setTimeout(() => {
        setError('');
      }, 10000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleOptimize('basic');
    }
  };

  const callDeepSeekAPI = async (prompt: string): Promise<string> => {
    // 使用 Next.js 环境变量读取机制
    // 优先读取客户端可访问的环境变量，然后回退到服务器端环境变量
    const getApiKey = (): string => {
      // 首先尝试读取客户端可访问的环境变量（以 NEXT_PUBLIC_ 开头的变量）
      const clientApiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
      if (clientApiKey && clientApiKey !== 'your_api_key_here') {
        return clientApiKey;
      }
      
      // 如果客户端环境变量不存在，尝试读取服务器端环境变量
      // 注意：在客户端组件中，非 NEXT_PUBLIC_ 前缀的环境变量可能为空
      // 但在构建时会被替换为实际值
      const serverApiKey = process.env.DEEPSEEK_API_KEY;
      if (serverApiKey && serverApiKey !== 'your_api_key_here') {
        return serverApiKey;
      }
      
      // 如果两种方式都失败，返回空字符串
      return '';
    };
    
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置。请检查：\n1. 项目根目录的 .env 文件中是否设置了 DEEPSEEK_API_KEY 或 NEXT_PUBLIC_DEEPSEEK_API_KEY\n2. 系统环境变量中是否设置了 DEEPSEEK_API_KEY');
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
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const originalContent = data.choices[0]?.message?.content || '优化失败，请重试';
    
    // 在原始响应内容末尾添加固定文本
    return `${originalContent}\n\n请严格按照以下工作流程完成我的诉求：
【## 背景说明

你是一个AI智能体工具。由于你的高级能力，你往往过于急切，经常在没有明确我的诉求时就生成内容（包括代码和非代码内容，下同），假设你比我更了解情况并在生成内容中随意发挥。这会导致我要求你做的工作出现不可接受的错误。在处理我的诉求时，你未经授权的修改可能会引入错误并破坏关键内容。为了防止这种情况，你必须遵循严格的协议。

## 元指令：模式声明要求

**你必须在每个响应开头用括号声明当前模式，没有例外。**
**格式：[MODE: 模式名称]**
**你必须在每个响应结尾明确给出"下一步"提示，让我了解推荐的下一步操作。"下一步"的具体提示信息参见下面各模式的描述。**
**未能声明模式和下一步是对协议的严重违反。**

## RIPER-5 模式

### 模式1：研究

[MODE: RESEARCH]

- **目的**：仅收集信息
- **允许**：读取文件、提出与我的诉求紧密相关的澄清问题、理解内容结构
- **禁止**：建议、实施、规划或任何暗示行动
- **要求**：只能寻求理解现有内容，而非可能的内容
- **持续时间**：直到我明确指示进入下一模式
- **下一步**：完整回复后，在末尾给出推荐操作："1. 输入 'ENTER INNOVATE MODE' 进入下一模式 2. 继续澄清需求，可复制：'进入下一模式前，还有疑问吗？'"
- **输出格式**：以 [MODE: RESEARCH] 开头，然后仅提供观察和问题

### 模式2：创新

[MODE: INNOVATE]

- **目的**：头脑风暴潜在的工作方向
- **允许**：讨论与我的诉求紧密相关的想法、优缺点，征求我的反馈，并针对我之前提到的顾虑提供推荐方向及理由
- **禁止**：具体的技术规划、实施细节或任何代码编写
- **要求**：所有想法必须作为可能性呈现，而非决定
- **持续时间**：直到我明确指示进入下一模式
- **下一步**：若已完整回复本模式，需在回复最后给出推荐操作，如："1. 输入 'ENTER PLAN MODE' 进入下一模式 2. 继续讨论可复制：'我没有看到你针对我的诉求提供的建议方向，请根据我的诉求提供推荐方案及理由。'"
- **输出格式**：以 [MODE: INNOVATE] 开头，然后仅提供可能性和考虑因素

### 模式3：计划

[MODE: PLAN]

- **目的**：创建详尽的工作步骤清单
- **允许**：包含工作所需的全部内容
- **禁止**：任何实施或脚本生成编写，即使是"示例内容"
- **要求**：计划必须足够全面，实施过程中无需创造性决策
- **强制最后步骤**：将计划转为编号清单，每个操作独立。在项目根目录创建 "todo-yyyy-mm-dd--hh-mm.md" 文件，yyyy-mm-dd--hh-mm 为当前时间戳（如："todo-2025-09-30--14-23.md"）
- **清单格式**：

实施清单：
1. [具体操作1]
2. [具体操作2]
...
n. [最终操作]

- **持续时间**：直到我明确批准计划并指示进入下一模式
- **下一步**：完成本模式回复后，需在最后给出推荐操作："1. 进入下一模式：'ENTER EXECUTE MODE' 2. 继续讨论可复制：'请为AI自身制定工作计划，只列清单无需时长预估。将计划转为带编号清单，每项相互独立，创建时间戳文件，重新执行 PLAN 模式。'"
- **输出格式**：以 [MODE: PLAN] 开头，然后仅提供规范和实施细节

### 模式4：执行

[MODE: EXECUTE]

- **目的**：准确实施模式3中的计划
- **允许**：
  - 按照"输出"要求生成工作步骤
  - 逐个处理待办事项，在模式3创建的 todo 文件中标记已完成项目
  - 在每一步给出简短的更改摘要
  - 仅实施批准计划中明确详述的内容
  - 最后在 todo 文件末尾附加审查部分，总结所做更改及相关信息
- **禁止**：任何不在计划中的偏离、改进或创造性添加，任何详细代码示例或系统内部具体实现的规格参数
- **进入要求**：仅在我明确发出 "ENTER EXECUTE MODE" 命令后进入
- **偏离处理**：如果发现任何需要偏离的问题，立即返回计划模式
- **下一步**：完整回复后，在末尾给出推荐操作："1. 'ENTER REVIEW MODE' 进入下一模式 2. 如不满意，可复制粘贴：'请重新执行 EXECUTE MODE。'"
- **输出格式**：以 [MODE: EXECUTE] 开头，然后仅提供与计划匹配的实施

### 模式5：审查

[MODE: REVIEW]

- **目的**：严格验证实施与计划的对照
- **允许**：逐行比较计划和实施
- **必需**：明确标记任何偏离，无论多么微小
- **偏离格式**："⚠️检测到偏离：[偏离的确切描述]"
- **报告**：必须报告实施是否与计划完全相同
- **结论格式**："✅实施与计划完全匹配" 或 "❌实施偏离计划"
- **下一步**：完整回复后，在最后给出推荐操作，如："你已完成一次完整的'暂停并澄清'提示词驱动的工作。此时可重新开启AI会话，进入下一工作过程。"
- **输出格式**：以 [MODE: REVIEW] 开头，然后进行系统比较和明确结论

## 关键协议指南

1. 未经我的明确许可，不能在模式间转换
2. 必须在每个响应开头声明当前模式
3. 在执行模式下，必须100%忠实地遵循计划
4. 在审查模式下，必须标记最小的偏离
5. 没有权限在声明模式外做出独立决策
6. 未能遵循此协议将导致代码库出现灾难性后果

## 模式转换信号

仅当我明确发出以下信号时才转换模式：

- "ENTER RESEARCH MODE"
- "ENTER INNOVATE MODE"
- "ENTER PLAN MODE"
- "ENTER EXECUTE MODE"
- "ENTER REVIEW MODE"

没有这些确切信号，保持当前模式。】。`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 主标题 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-4">
            减少 AI 幻觉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            通过优化提示词，帮助AI提供更准确、可验证的信息
          </p>
        </header>

        {/* 主要内容区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* 输入区域 */}
          <div className="mb-8">
            <label 
              htmlFor="prompt-input" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
            >
              请输入您的提示词：
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <textarea
                  id="prompt-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="例如：请介绍一下人工智能的发展历史..."
                  className="w-full h-32 md:h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  提示：按 Ctrl+Enter 快速提交（查询常识优化）
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={() => handleOptimize('basic')}
                  disabled={!userInput.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && optimizationType === 'basic' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      查询常识优化
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleOptimize('deepseek')}
                  disabled={!userInput.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && optimizationType === 'deepseek' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      应对未知与复杂问题优化
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>

            {/* 错误信息显示 */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg animate-pulse">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* 优化结果区域 */}
          {optimizedPrompt && (
            <div 
              ref={resultRef}
              className={`mt-8 p-6 rounded-lg border transition-all duration-300 ${
                optimizationType === 'basic' 
                  ? 'bg-orange-50 dark:bg-gray-700 border-orange-200 dark:border-gray-600'
                  : 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                  optimizationType === 'basic' 
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  优化后的提示词：
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  optimizationType === 'basic'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {optimizationType === 'basic' ? '查询常识优化' : '应对未知与复杂问题优化'}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-orange-100 dark:border-gray-600">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {optimizedPrompt}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(optimizedPrompt)}
                  className={`px-3 py-1 text-sm rounded transition-colors duration-200 flex items-center gap-1 ${
                    optimizationType === 'basic'
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </button>
                <button
                  onClick={() => setOptimizedPrompt('')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors duration-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  清除
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>这个工具通过在您的提示词前后添加特定文本，帮助AI提供更准确、可验证的信息</p>
        </div>
      </div>
    </div>
  );
}