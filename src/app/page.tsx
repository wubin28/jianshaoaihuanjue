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
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('API密钥未配置，请检查环境变量设置');
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
            content: '你是一位专业的AI提示词优化专家。请对用户提供的提示词进行优化，确保提示词能够引导AI模型生成高质量的回答。具体要求如下：\n\n1) 阅读用户输入的待优化提示词，然后用以下元素组合成优化后的提示词：\n\nRole——根据问题领域，AI应扮演的专家角色，以"你是"开头；\n\n2) 示例：\n- 输入："请问\'氛围编程\'这个词最初是谁在什么时候提出的"\n- 期望："你是AI辅助软件开发专家，请问\'氛围编程\'这个词最初是谁在什么时候提出的？"\n\n3) 请直接返回优化后的文本，不要添加任何解释或额外内容。'
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
    return data.choices[0]?.message?.content || '优化失败，请重试';
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