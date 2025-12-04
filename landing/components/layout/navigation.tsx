import { HStack, Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react'
import { useDisclosure, useUpdateEffect } from '@chakra-ui/react'
import { useScrollSpy } from 'hooks/use-scrollspy'
import { usePathname, useRouter } from 'next/navigation'

import * as React from 'react'

import { GetStartedButton } from '#components/get-started-button/get-started-button'
import { MobileNavButton } from '#components/mobile-nav'
import { MobileNavContent } from '#components/mobile-nav'
import { NavLink } from '#components/nav-link'
import siteConfig from '#data/config'


const Navigation: React.FC = () => {
  const mobileNav = useDisclosure()
  const router = useRouter()
  const path = usePathname()
  const activeId = useScrollSpy(
    siteConfig.header.links
      .filter(({ id }) => id)
      .map(({ id }) => `[id="${id}"]`),
    {
      threshold: 0.75,
    },
  )

  const mobileNavBtnRef = React.useRef<HTMLButtonElement>()

  useUpdateEffect(() => {
    mobileNavBtnRef.current?.focus()
  }, [mobileNav.isOpen])

  return (
    <HStack spacing="2" flexShrink={0}>
      {siteConfig.header.links.map(({ href, id, children, ...props }, i) => {
        // Replace Sign Up button with GetStartedButton
        if (props.label === 'Sign Up') {
          return (
            <GetStartedButton
              key={i}
              display={['none', null, 'block']}
              size="sm"
              lineHeight="2rem"
              fontWeight="medium"
            />
          )
        }

        // If link has children, render as dropdown menu
        if (children && children.length > 0) {
          return (
            <Menu key={i}>
              <MenuButton
                as={Button}
                display={['none', null, 'block']}
                variant="nav-link"
                lineHeight="2rem"
                fontWeight="medium"
                isActive={
                  !!(
                    (id && activeId === id) ||
                    (href && !!path?.match(new RegExp(href)))
                  )
                }
              >
                {props.label}
              </MenuButton>
              <MenuList
                bg="whiteAlpha.900"
                backdropFilter="blur(10px)"
                borderColor="whiteAlpha.300"
                boxShadow="lg"
                py={2}
                _dark={{
                  bg: 'blackAlpha.900',
                  borderColor: 'whiteAlpha.300',
                }}
              >
                {children.map((child, j) => (
                  <MenuItem
                    key={j}
                    as="a"
                    href={child.href || `/#${child.id}`}
                    onClick={() => {
                      if (child.href) {
                        router.push(child.href)
                      }
                    }}
                    fontWeight="medium"
                    fontSize="sm"
                    bg="transparent"
                    _hover={{
                      bg: 'blackAlpha.100',
                      _dark: { bg: 'whiteAlpha.200' }
                    }}
                    transition="background 0.2s"
                  >
                    {child.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          )
        }

        return (
          <NavLink
            display={['none', null, 'block']}
            href={href || `/#${id}`}
            key={i}
            isActive={
              !!(
                (id && activeId === id) ||
                (href && !!path?.match(new RegExp(href)))
              )
            }
            {...props}
          >
            {props.label}
          </NavLink>
        )
      })}

      <MobileNavButton
        ref={mobileNavBtnRef}
        aria-label="Open Menu"
        onClick={mobileNav.onOpen}
      />

      <MobileNavContent isOpen={mobileNav.isOpen} onClose={mobileNav.onClose} />
    </HStack>
  )
}

export default Navigation
