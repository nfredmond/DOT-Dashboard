import localFont from 'next/font/local'

export const geistSans = localFont({
  src: [
    {
      path: '../../src/app/fonts/GeistVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const geistMono = localFont({
  src: [
    {
      path: '../../src/app/fonts/GeistMonoVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-mono',
  display: 'swap',
}) 