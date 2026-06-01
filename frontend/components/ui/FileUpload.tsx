import React, { useState, useRef } from 'react';
import { FileUp, X, File, AlertCircle } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (files: FileList | null) => void;
    accept?: string;
    maxSizeMB?: number;
    multiple?: boolean;
    label?: string;
    description?: string;
    hideList?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = "*",
    maxSizeMB = 100,
    multiple = true,
    label = "Dosya Yükle",
    description = "Dosyaları buraya bırakın veya tıklayarak seçin",
    hideList = false
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndSetFiles = (files: FileList | null) => {
        setError(null);
        if (!files || files.length === 0) return;

        const validFiles: File[] = [];
        let hasError = false;

        Array.from(files).forEach(file => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`${file.name} boyutu ${maxSizeMB}MB'dan büyük.`);
                hasError = true;
            } else {
                validFiles.push(file);
            }
        });

        if (!hasError) {
            let newSelectedFiles = [...selectedFiles];
            if (multiple) {
                const uniqueNewFiles = validFiles.filter(
                    vf => !newSelectedFiles.some(sf => sf.name === vf.name && sf.size === vf.size)
                );
                newSelectedFiles = [...newSelectedFiles, ...uniqueNewFiles];
            } else {
                newSelectedFiles = validFiles;
            }
            setSelectedFiles(newSelectedFiles);

            // Reconstruct FileList using DataTransfer
            try {
                const dataTransfer = new DataTransfer();
                newSelectedFiles.forEach(f => dataTransfer.items.add(f));
                onFileSelect(dataTransfer.files);
            } catch (e) {
                // Fallback for older browsers
                onFileSelect(files);
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        
        if (newFiles.length === 0) {
            if (inputRef.current) inputRef.current.value = '';
            onFileSelect(null);
        } else {
            try {
                const dataTransfer = new DataTransfer();
                newFiles.forEach(f => dataTransfer.items.add(f));
                onFileSelect(dataTransfer.files);
            } catch (e) {
                onFileSelect(null);
            }
        }
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}

            <div
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-white
                    ${dragActive ? 'border-primary bg-blue-50/50 scale-[1.01]' : 'border-gray-200 hover:border-primary hover:bg-gray-50'}
                    ${error ? 'border-red-300 bg-red-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
                    <div className={`p-3 rounded-full ${dragActive ? 'bg-blue-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                        <FileUp size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                            {description}
                        </p>
                        <p className="text-xs text-gray-400">
                            (Maksimum {maxSizeMB}MB)
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-500 font-medium animate-in slide-in-from-top-1">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!hideList && selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded-lg border border-gray-100 text-blue-600">
                                    <File size={16} />
                                </div>
                                <span className="text-sm text-gray-700 truncate font-medium">{file.name}</span>
                                <span className="text-xs text-gray-400 whitespace-nowrap">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(i);
                                }}
                                className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-red-500 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
