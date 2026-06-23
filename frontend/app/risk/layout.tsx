'use client';
import { ToastProvider } from '@/components/Toast';
import RiskLayoutComponent from '@/components/risk/RiskLayout';
import { RiskTitleProvider } from '@/context/RiskTitleContext';

export default function RiskAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ToastProvider>
            <RiskTitleProvider>
                <RiskLayoutComponent>
                    {children}
                </RiskLayoutComponent>
            </RiskTitleProvider>
        </ToastProvider>
    )
}
