import { Image, HTMLChakraProps, useColorModeValue } from '@chakra-ui/react'

export const Logo: React.FC<HTMLChakraProps<'img'>> = (props) => {
  const logoSrc = useColorModeValue(
    'https://cdn.smoosense.ai/SmooSense-light.svg',
    'https://cdn.smoosense.ai/SmooSense-dark.svg'
  )

  return (
    <Image
      src={logoSrc}
      alt="SmooSense Logo"
      height="28px"
      {...props}
    />
  )
}
