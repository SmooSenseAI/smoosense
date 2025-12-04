import * as React from 'react';


const faq = {
  title: 'Frequently asked questions',
  // description: '',
  items: [
    {
      q: 'Can I use it for my private data?',
      a: (
        <>
          Yes. SmooSense is a pure software that can run in your local network.
          Your data can be on your laptop, in your on-prem cloud, or VPC, never
          transferred out.
        </>
      ),
    },
    {
      q: 'Can I use it in my open-source or commercial project?',
      a: 'Yes. SmooSense is licensed under Apache 2.0, a permissive open source license. You can use it for any purpose, including commercial use, modify it, and deploy it in production.',
    },
    {
      q: 'Is the full source code available?',
      a: 'Yes. SmooSense is fully open source under Apache 2.0. Both the Python SDK and the GUI source code will be available on GitHub.'
    },
    {
      q: 'Do you provide tailored solution for enterprise?',
      a: 'Yes. Contact us at contact@smoosense.ai'
    },

  ],
}

export default faq
