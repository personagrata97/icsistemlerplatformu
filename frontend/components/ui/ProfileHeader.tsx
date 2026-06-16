import React from 'react';
import { Mail, Phone, MapPin, Building, Camera, Edit2 } from 'lucide-react';
import Button from './Button';

type ProfileHeaderProps = {
    staff: any;
    isViewMode?: boolean;
    onEditClick?: () => void;
    onPhotoClick?: () => void;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ staff, isViewMode, onEditClick, onPhotoClick }) => {
    if (!staff) return null;

    const displayName = staff.displayName || staff.user?.displayName || `${staff.firstName} ${staff.lastName}`;
    
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col gap-4">
                    <div
                        className={`w-36 h-36 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative transition-all ${!isViewMode ? 'hover:border-primary hover:bg-primary/5 cursor-pointer group' : ''}`}
                        onClick={!isViewMode ? onPhotoClick : undefined}
                        title={!isViewMode ? "Fotoğraf yüklemek için tıklayın" : ""}
                    >
                        {staff.photoUrl ? (
                            <img src={staff.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <span className="text-4xl font-bold text-slate-300">{getInitials(displayName)}</span>
                                {!isViewMode && <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary absolute bottom-4 right-4 bg-white p-1 rounded-full shadow-sm" />}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow flex flex-col justify-between py-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${staff.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {staff.status || 'Aktif'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-medium mb-4">
                                <Building size={16} />
                                <span>{staff.title || 'Müfettiş'}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 font-normal">{staff.department || 'Teftiş Kurulu Başkanlığı'}</span>
                            </div>
                        </div>

                        {!isViewMode && onEditClick && (
                            <Button variant="outline" size="sm" leftIcon={<Edit2 size={14} />} onClick={onEditClick}>
                                Profili Düzenle
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-y-3 gap-x-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={16} className="text-slate-400" />
                            <span>{staff.email || staff.user?.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={16} className="text-slate-400" />
                            <span>{staff.phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={16} className="text-slate-400" />
                            <span>{staff.location || 'Merkez / İstanbul'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
