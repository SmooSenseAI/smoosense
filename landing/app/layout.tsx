import { ColorModeScript, theme } from '@chakra-ui/react'
import Script from 'next/script'
import type { Metadata } from 'next'

import { Provider } from './provider'
import { MarketingLayout } from '#components/layout'

export const metadata: Metadata = {
  title: 'SmooSense: open source multimodal data IDE for audios, videos, images and embeddings',
  description: 'Interactively explore multimodal data',
}

export default function Layout(props: { children: React.ReactNode }) {
  const colorMode = 'dark'

  return (
    <html lang="en" data-theme={colorMode} style={{ colorScheme: colorMode }}>
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="https://cdn.smoosense.ai/fav-dark.svg"
        />
      </head>
      <body className={`chakra-ui-${colorMode}`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L31W431HSV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L31W431HSV');
          `}
        </Script>

        <ColorModeScript initialColorMode={colorMode} />
        <Provider>
          <MarketingLayout>{props.children}</MarketingLayout>
        </Provider>
      </body>
    </html>
  )
}
