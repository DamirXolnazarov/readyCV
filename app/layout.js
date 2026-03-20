import Providers from './providers'
import FeedbackWidget from '@/components/FeedbackWidget'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: 'ICVY',
  description: 'AI-powered resume builder',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <Providers>
          {children}
          <FeedbackWidget />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  )
}