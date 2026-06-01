import React from 'react';
import { Eye, Edit, Trash2, Bell, History as HistoryIcon } from 'lucide-react';
import { Finding } from '@/lib/audit-api';
import { useAuth } from '@/context/AuthContext';
import ActionMenu from '@/components/ui/ActionMenu';

interface FindingActionButtonsProps {
    finding: Finding;
    isManager: boolean;
    onView: (finding: Finding) => void;
    onEdit?: (finding: Finding) => void;
    onDelete?: (finding: Finding) => void;
    onStatusUpdate?: (finding: Finding, newStatus: string) => void;
    onReviewRequest?: (finding: Finding) => void;
    onNotify?: (finding: Finding) => void;
    onAcceptRisk?: (finding: Finding) => void;
    onExtensionRequest?: (finding: Finding) => void;
    onVerifyEvidence?: (finding: Finding) => void;
    showLabels?: boolean; // deprecated, kept for prop compatibility
}

export default function FindingActionButtons({
    finding,
    isManager,
    onView,
    onEdit,
    onDelete,
    onStatusUpdate,
    onReviewRequest,
    onNotify,
    onAcceptRisk,
    onExtensionRequest,
    onVerifyEvidence,
}: FindingActionButtonsProps) {
    const items = [
        { label: 'Detayı İncele', icon: Eye, onClick: () => onView(finding) }
    ];

    if (isManager && onEdit) {
        items.push({ label: 'Düzenle', icon: Edit, onClick: () => onEdit(finding) });
    }
    
    if (isManager && onDelete) {
        items.push({ label: 'Sil', icon: Trash2, onClick: () => onDelete(finding) });
    }
    
    // Sadece onaylanmış bulgular birime tebliğ edilebilir
    const canNotify = ['Onaylandı', 'Yeni'].includes(finding.status);
    if (onNotify && canNotify) {
        items.push({ label: 'Tebliğ Et', icon: Bell, onClick: () => onNotify(finding) });
    }
    
    // Sadece onay bekleyen/inceleme aşamasındaki taslak bulgular için Revizyon Talep edilebilir
    const canRequestReview = ['Taslak', 'Onay Bekliyor', 'İnceleme Bekliyor', 'Revizyon Gerekli', 'İnceleme Tamamlandı'].includes(finding.status);
    if (onReviewRequest && canRequestReview) {
        items.push({ label: 'Revizyon Talep Et', icon: HistoryIcon, onClick: () => onReviewRequest(finding) });
    }

    return (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
            <ActionMenu items={items} />
        </div>
    );
}

