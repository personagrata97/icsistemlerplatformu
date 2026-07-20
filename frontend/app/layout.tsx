import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import LayoutWrapper from '@/components/LayoutWrapper'
import { ToastProvider } from '@/components/Toast'
import { ModalProvider } from '@/context/ModalContext'
import { GlobalModalPresenter } from '@/components/modals/GlobalModalPresenter'
import { AuthProvider } from '@/context/AuthContext'
import { AuditTitleProvider } from '@/context/AuditTitleContext'

const poppins = localFont({
    src: [
        {
            path: '../public/fonts/Poppins-Light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/fonts/Poppins-Regular.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../public/fonts/Poppins-Medium.ttf',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../public/fonts/Poppins-SemiBold.ttf',
            weight: '600',
            style: 'normal',
        },
        {
            path: '../public/fonts/Poppins-Bold.ttf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--font-poppins',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'İç Sistemler Platformu - Teftiş Kurulu Modülü',
    description: 'Entegre Risk, Denetim ve Yaptırım Yönetimi',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body className={`${poppins.variable} font-sans antialiased text-main-text bg-gray-50`}>
                <AuthProvider>
                    <AuditTitleProvider>
                        <ToastProvider>
                            <ModalProvider>
                                <LayoutWrapper>
                                    {children}
                                </LayoutWrapper>
                                <GlobalModalPresenter />
                            </ModalProvider>
                        </ToastProvider>
                    </AuditTitleProvider>
                </AuthProvider>
            </body>
        </html>
    )
}

