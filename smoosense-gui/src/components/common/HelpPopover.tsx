'use client'

import React from 'react'
import { HelpCircle, ExternalLink, Mail } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import { CLS } from '@/lib/utils/styles'
import { Separator } from '@/components/ui/separator'

export default function HelpPopover() {
  const sections = [
    {
      title: 'Help',
      links: [
        {
          label: 'Read docs',
          url: 'https://smoosense.ai/docs',
          icon: <ExternalLink className="h-3 w-3" />
        },
        {
          label: 'Consult tailored solution',
          url: 'mailto:contact@smoosense.ai',
          icon: <Mail className="h-3 w-3" />
        }
      ]
    },
    {
      title: 'GitHub',
      links: [],
      badges: [
        {
          alt: 'Issues',
          src: 'https://img.shields.io/github/issues/SmooSenseAI/smoosense?label=Submit+new+issue',
          url: 'https://github.com/SmooSenseAI/smoosense/issues'
        },
        {
          alt: 'Stars',
          src: 'https://img.shields.io/github/stars/SmooSenseAI/smoosense',
          url: 'https://github.com/SmooSenseAI/smoosense/stargazers'
        }
      ]
    },
    {
      title: 'Try SmooSense with your data',
      links: [
        {
          label: 'Get started',
          url: 'https://smoosense.ai/start',
          icon: <ExternalLink className="h-3 w-3" />
        }
      ],
      badges: [
        {
          alt: 'Latest version',
          src: 'https://img.shields.io/pypi/v/smoosense?label=pypi-latest',
          url: 'https://pypi.org/project/smoosense/'
        },
        {
          alt: 'Downloads',
          src: 'https://static.pepy.tech/personalized-badge/smoosense?period=total&units=international_system&left_color=black&right_color=MAGENTA&left_text=downloads',
          url: 'https://pepy.tech/project/smoosense'
        }
      ]
    }
  ]

  return (
    <IconPopover
      icon={<HelpCircle className="h-4 w-4" />}
      tooltip="Help & Resources"
      contentClassName="w-auto p-3"
      align="end"
    >
      <div className="min-w-[240px]">
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {sectionIndex > 0 && <Separator className="my-3" />}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1.5">
                {section.title}
              </h4>
              {section.badges && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {section.badges.map((badge, badgeIndex) => (
                    <a
                      key={badgeIndex}
                      href={badge.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={badge.src}
                        alt={badge.alt}
                        className="h-6 mx-1"
                      />
                    </a>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {section.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between gap-2 text-sm ${CLS.HYPERLINK} py-1`}
                  >
                    <span>{link.label}</span>
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </IconPopover>
  )
}
