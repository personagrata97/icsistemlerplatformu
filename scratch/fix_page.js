const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'audit', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The exact broken target string
const brokenTarget = `                                    <div className="flex items-center gap-3">
                                        <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Onay Bekliyor</h4>
                            <p className="text-blue-100 text-xs mb-4">Gözetim sorumlusu onayı gereken bulgular</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>`;

// The correct replacement string
const correctReplacement = `                                    <div className="flex items-center gap-3">
                                        <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${
                                            finding.risk === 'Kritik' ? 'bg-red-50 text-red-600' :
                                            finding.risk === 'Yüksek' ? 'bg-orange-50 text-orange-600' :
                                            finding.risk === 'Orta' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                                        }\`}>
                                            {finding.risk}
                                        </span>
                                        <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${
                                            finding.status === 'Açık' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }\`}>
                                            {finding.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Sistem Logları / Son İşlemler */}
                <div className="card h-full flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Activity size={20} className="text-primary" />
                                    Son İşlem Logları
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">Platform genelindeki son kullanıcı izleri</p>
                            </div>
                            <Link href="/audit/logs" className="btn btn-ghost text-xs hover:bg-slate-100 font-semibold gap-1">
                                Tüm Loglar <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {activities.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-slate-100 pl-4 py-1 hover:border-primary transition-all duration-300">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-800">{log.user}</div>
                                        <div className="text-slate-500 mt-0.5">{log.action || log.status}</div>
                                        <div className="text-[10px] text-gray-400 mt-1 font-medium">
                                            {log.date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bekleyen İşlemler (Eski Yönetici Görev Paneli) */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-primary" />
                    Bekleyen İşlemler
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Onay Bekleyen Bulgular - Mavi */}
                    <Link href="/audit/findings?status=Onay%20Bekliyor" className="group relative overflow-hidden bg-blue-600 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <span className="text-4xl font-bold text-white">{findings.filter(f => f.status === 'Onay Bekliyor').length}</span>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Calendar size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <h4 className="font-bold text-lg text-white mb-1">Onay Bekliyor</h4>
                            <p className="text-blue-100 text-xs mb-4">Gözetim sorumlusu onayı gereken bulgular</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
                                Görüntüle <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-2" />
                            </div>
                        </div>
                    </Link>`;

// Normalize CRLF to LF for reliable comparison
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = brokenTarget.replace(/\r\n/g, '\n');
const normalizedReplacement = correctReplacement.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const newContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    // Write back with Windows line endings if the original had CRLF
    const finalContent = content.includes('\r\n') ? newContent.replace(/\n/g, '\r\n') : newContent;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Successfully fixed page.tsx!');
} else {
    console.error('Target not found in page.tsx!');
    
    // Fallback: let's try a regex or a partial match
    const partialTarget = `                                    <div className="flex items-center gap-3">
                                        <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${`;
    const normalizedPartial = partialTarget.replace(/\r\n/g, '\n');
    
    if (normalizedContent.includes(normalizedPartial)) {
        console.log('Found partial target!');
        // We find index of partial target and replace until the end of the Link component
        const index = normalizedContent.indexOf(normalizedPartial);
        const linkEndIndex = normalizedContent.indexOf('</Link>', index);
        if (linkEndIndex !== -1) {
            const before = normalizedContent.substring(0, index);
            const after = normalizedContent.substring(linkEndIndex + '</Link>'.length);
            const newContent = before + normalizedReplacement + after;
            const finalContent = content.includes('\r\n') ? newContent.replace(/\n/g, '\r\n') : newContent;
            fs.writeFileSync(filePath, finalContent, 'utf8');
            console.log('Successfully fixed page.tsx via partial search!');
        } else {
            console.error('Could not find </Link> after partial target!');
        }
    } else {
        console.error('Partial target not found either!');
    }
}
