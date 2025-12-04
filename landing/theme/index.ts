import { extendTheme } from '@chakra-ui/react'
import '@voaii/proxima-nova/400.css'
import '@voaii/proxima-nova/700.css'
import { theme as baseTheme } from '@saas-ui/react'

import components from './components'
import { fontSizes } from './foundations/typography'

export const theme = extendTheme(
  {
    config: {
      initialColorMode: 'dark',
      useSystemColorMode: false,
    },
    styles: {
      global: (props: any) => ({
        body: {
          color: 'gray.900',
          bg: 'white',
          fontSize: 'lg',
          _dark: {
            color: 'white',
            bg: 'gray.900',
          },
        },
      }),
    },
    fonts: {
      heading: 'Proxima Nova, sans-serif',
      body: 'Proxima Nova, sans-serif',
    },
    fontSizes,
    components,
  },
  baseTheme,
)
