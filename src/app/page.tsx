'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleOptimize = () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    
    // 模拟异步处理
    setTimeout(() => {
      const prefix = "你是专家";
      const suffix = "请提供主要观点的3个不同出处的网页链接以便我查验。如果你不知道或查不到，就实说，不要编造";
      const optimized = `${prefix} ${userInput.trim()}，${suffix}`;
      
      setOptimizedPrompt(optimized);
      setUserInput('');
      setIsLoading(false);
      
      // 平滑滚动到结果区域
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleOptimize();
    }
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
                  提示：按 Ctrl+Enter 快速提交
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex md:flex-col justify-center">
                <button
                  onClick={handleOptimize}
                  disabled={!userInput.trim() || isLoading}
                  className="px-8 py-3 md:px-6 md:py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      查询常识
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 优化结果区域 */}
          {optimizedPrompt && (
            <div 
              ref={resultRef}
              className="mt-8 p-6 bg-orange-50 dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-gray-600 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                优化后的提示词：
              </h3>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-orange-100 dark:border-gray-600">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {optimizedPrompt}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(optimizedPrompt)}
                  className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors duration-200 flex items-center gap-1"
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