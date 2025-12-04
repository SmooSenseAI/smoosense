import { Button, ButtonProps } from '@chakra-ui/react'
import { trackEvent } from '../../lib/analytics'

export interface GetStartedButtonProps extends Omit<ButtonProps, 'href'> {}

export const GetStartedButton = ({ size = "lg", ...props }: GetStartedButtonProps) => {
  const handleClick = () => {
    trackEvent({
      action: 'click',
      category: 'engagement',
      label: 'get_started_button',
    })
  }

  return (
    <Button
      as="a"
      href="/start"
      rel="noopener noreferrer"
      colorScheme="primary"
      size={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      onClick={handleClick}
      {...props}
    >
      Get Started
    </Button>
  )
}