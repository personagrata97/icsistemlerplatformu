import { Plus, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';


// Simple ID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

export interface ActionItem {
    id: string;
    action: string;
    dueDate: string;
    responsible: string;
    escalationLevel?: number;
    lastEscalatedAt?: string;
}

interface ActionListProps {
    actions: ActionItem[];
    onChange: (actions: ActionItem[]) => void;
    readOnly?: boolean;
}

const ActionList: React.FC<ActionListProps> = ({ actions, onChange, readOnly = false }) => {

    const addAction = () => {
        onChange([...actions, { id: generateId(), action: '', dueDate: '', responsible: '' }]);
    };

    const removeAction = (id: string) => {
        onChange(actions.filter(a => a.id !== id));
    };

    const updateAction = (id: string, field: keyof ActionItem, value: string) => {
        onChange(actions.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Aksiyon Listesi</label>
                </div>
                {!readOnly && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={addAction}
                        className="h-7 text-[10px] font-bold gap-1 bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
                        leftIcon={<Plus size={12} />}
                    >
                        Aksiyon Ekle
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {actions.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        Henüz aksiyon eklenmemiş.
                    </div>
                )}

                {actions.map((action, idx) => {
                    const isEscalated = (action.escalationLevel || 0) > 0;
                    return (
                        <div key={action.id || idx} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-xl border shadow-sm transition-all group relative ${isEscalated ? 'bg-red-50/50 border-red-200 hover:border-red-300' : 'bg-white border-gray-100 hover:border-primary/30'}`}>
                            {/* Number Badge */}
                            <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border transition-colors ${isEscalated ? 'bg-red-100 text-red-600 border-red-200 group-hover:bg-red-500' : 'bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-primary'} group-hover:text-white`}>
                                {idx + 1}
                            </div>

                            {/* Eskalasyon Uyarısı */}
                            {isEscalated && (
                                <div className="md:col-span-12 flex items-center gap-2 mb-2 text-red-600 bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg w-fit">
                                    <AlertTriangle size={14} className="stroke-[2.5px]" />
                                    <span className="text-xs font-bold tracking-wide uppercase">{action.escalationLevel}. Seviye Eskalasyon UyarıSı - Vadesi Gecikmiş</span>
                                </div>
                            )}

                            <div className="md:col-span-5 pl-2">
                                <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider">Aksiyon Tanımı</label>
                                <input
                                    type="text"
                                    className="form-input text-xs bg-gray-50/30"
                                    value={action.action}
                                    onChange={e => updateAction(action.id, 'action', e.target.value)}
                                    placeholder="Yapılacak işlem..."
                                    readOnly={readOnly}
                                    required
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider flex items-center gap-1">
                                    <Calendar size={14} /> Vade
                                </label>
                                <input
                                    type="date"
                                    className="form-input text-xs bg-gray-50/30"
                                    value={action.dueDate}
                                    onChange={e => updateAction(action.id, 'dueDate', e.target.value)}
                                    readOnly={readOnly}
                                    required
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wider flex items-center gap-1">
                                    <User size={14} /> Sorumlu
                                </label>
                                <input
                                    type="text"
                                    className="form-input text-xs bg-gray-50/30"
                                    value={action.responsible}
                                    onChange={e => updateAction(action.id, 'responsible', e.target.value)}
                                    placeholder="İsim / Ünvan"
                                    readOnly={readOnly}
                                    required
                                />
                            </div>
                            {!readOnly && (
                                <div className="md:col-span-1 flex justify-end">
                                    <button
                                        type="button"
                                        title="Aksiyonu Sil"
                                        className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        onClick={() => removeAction(action.id)}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default ActionList;
