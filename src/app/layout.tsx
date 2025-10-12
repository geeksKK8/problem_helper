import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth-context"
import { CopilotKit } from "@copilotkit/react-core"; 
import "@copilotkit/react-ui/styles.css";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI助手 - 智能题目分析",
  description: "基于AI的数学题目分析助手，帮助您找到相关题目",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </CopilotKit>
      </body>
    </html>
  )
} 