import './globals.css'

export const metadata = {
  title: '성경 퀴즈 게임',
  description: '구약에서 신약까지 10단계 성경 지식 퀴즈',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}