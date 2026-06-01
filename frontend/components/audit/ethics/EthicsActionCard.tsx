import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EthicsActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    buttonText: string;
    buttonIcon: LucideIcon;
    onClick: () => void;
    variant: 'green' | 'blue';
}

export const EthicsActionCard: React.FC<EthicsActionCardProps> = ({
    title,
    description,
    icon: Icon,
    buttonText,
    buttonIcon: ButtonIcon,
    onClick,
    variant
}) => {
    const theme = {
        green: {
            bgGradient: 'from-primary/5',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            buttonBg: 'bg-primary hover:bg-primary-hover',
            buttonShadow: 'shadow-primary/20'
        },
        blue: {
            bgGradient: 'from-blue-500/5',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            buttonShadow: 'shadow-blue-100/50'
        }
    };

    const t = theme[variant];

    return (
        <div className="group relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full">
            <div className={`absolute inset-0 bg-gradient-to-br ${t.bgGradient} to-transparent rounded-3xl pointer-events-none`} />
            <div className="relative z-10 flex flex-col flex-1">
                <div className={`w-16 h-16 ${t.iconBg} ${t.iconColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed flex-1">
                    {description}
                </p>
                <Button
                    onClick={onClick}
                    variant={variant === 'green' ? 'primary' : 'primary'} // Şimdilik hepsi primary (yeşil) olsun, override edebiliriz
                    className={`w-full ${variant === 'blue' ? '!bg-blue-600 hover:!bg-blue-700 shadow-blue-500/30' : ''}`}
                    size="lg"
                    leftIcon={<ButtonIcon size={20} />}
                >
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};
