"use client"

import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  html: string
  className?: string
}

const KatexHtmlRenderer: React.FC<Props> = ({ html, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null)

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
  }, [html])

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default KatexHtmlRenderer 