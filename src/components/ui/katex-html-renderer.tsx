"use client"

import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  html: string
  className?: string
  preserveLineBreaks?: boolean
}

// 内容处理函数，类似PDF生成中的processContent
function processContent(content: string): string {
  if (!content) return ''
  
  // 清理HTML标签但保留基本格式和换行，保留图片标签
  const processed = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // 移除style标签
    .replace(/<br\s*\/?>/gi, '\n') // 将<br>标签转换为换行符
    .replace(/<\/p>/gi, '\n') // 将</p>标签转换为换行符
    .replace(/<p[^>]*>/gi, '') // 移除<p>开始标签
    .replace(/<div[^>]*>/gi, '') // 移除<div>开始标签
    .replace(/<\/div>/gi, '\n') // 将</div>标签转换为换行符
    .replace(/<[^>]*>/g, (match) => {
      // 保留img标签，移除其他标签
      if (match.toLowerCase().startsWith('<img')) {
        return match
      }
      return ''
    })
    .replace(/&nbsp;/g, ' ') // 替换空格实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n/g, '\n') // 合并多个连续换行
    .replace(/^\s+|\s+$/g, '') // 去除首尾空白
    .replace(/\n/g, '<br>') // 将换行符转换为HTML换行标签
  
  return processed
}

const KatexHtmlRenderer: React.FC<Props> = ({ html, className = "", preserveLineBreaks = false }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 处理HTML内容
  const processedHtml = preserveLineBreaks ? processContent(html) : html

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // 查找所有公式片段（$...$ 和 $$...$$）
    const renderMathInElement = (element: HTMLElement) => {
      // 使用递归方式遍历所有文本节点
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text
          const text = textNode.nodeValue
          if (!text) return

          const parent = textNode.parentElement
          if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return

          // 检查是否包含数学公式
          const hasMath = /\${1,2}[^$]+\${1,2}/.test(text)
          if (!hasMath) return

          const fragments = text.split(/(\${1,2}[^$]+\${1,2})/g)
          if (fragments.length > 1) {
            const span = document.createElement('span')
            fragments.forEach(fragment => {
              const match = fragment.match(/^\${1,2}(.+?)\${1,2}$/)
              if (match) {
                const isDisplayMode = fragment.startsWith('$$')
                const math = match[1]
                const spanMath = document.createElement('span')
                try {
                  katex.render(math, spanMath, { displayMode: isDisplayMode })
                  span.appendChild(spanMath)
                } catch (e) {
                  console.warn('KaTeX render error:', e)
                  span.appendChild(document.createTextNode(fragment))
                }
              } else {
                span.appendChild(document.createTextNode(fragment))
              }
            })
            parent.replaceChild(span, textNode)
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // 递归处理子元素
          const element = node as Element
          const children = Array.from(element.childNodes)
          children.forEach(child => processNode(child))
        }
      }

      // 从根元素开始处理
      processNode(element)
    }

    // 使用setTimeout确保DOM完全渲染后再处理
    const timer = setTimeout(() => {
      renderMathInElement(el)
    }, 0)

    return () => clearTimeout(timer)
  }, [processedHtml])

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  )
}

export default KatexHtmlRenderer 