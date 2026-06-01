'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface AuditWorkflowStepperProps {
    workflowSteps: string[];
    currentStatus: string;
}

const AuditWorkflowStepper: React.FC<AuditWorkflowStepperProps> = ({
    workflowSteps,
    currentStatus
}) => {
    const currentStepIndex = workflowSteps.indexOf(currentStatus || 'Taslak');

    return (
        <div className="flex justify-between mb-8 relative px-4">
            {workflowSteps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                    <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-sm ${isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
                                'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                            {isCompleted ? <Check size={18} /> : index + 1}
                        </div>
                        <span className={`text-xs mt-2 font-medium text-center transition-colors ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                            {step}
                        </span>
                    </div>
                );
            })}
            {/* Stepper Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0 mx-12">
                <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(0, (currentStepIndex / (workflowSteps.length - 1)) * 100)}%` }}
                />
            </div>
        </div>
    );
};

export default AuditWorkflowStepper;
