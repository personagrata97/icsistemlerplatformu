const fs = require('fs');
let content = fs.readFileSync('frontend/app/sanction/results/page.tsx', 'utf8');

// Add handleCreateFinding
content = content.replace(
    `const handleClearAll = () => {`,
    `const handleCreateFinding = async (item: any) => {
        try {
            await sanctionApi.createFindingFromMatch(item.id);
            showToast('Denetim bulgusu başarıyla oluşturuldu.', 'success');
        } catch (error) {
            showToast('Bulgu oluşturulurken hata oluştu.', 'error');
        }
    };

    const handleClearAll = () => {`
);

// Update actions column
content = content.replace(
    `key: 'actions',
                        header: 'Karar Ver',
                        width: '140px',
                        align: 'center',
                        render: (item: any) => (
                            <Button size="sm" variant="secondary" onClick={() => setSelectedMatch(item)}>İncele & Karar</Button>
                        )`,
    `key: 'actions',
                        header: 'İşlemler',
                        width: '180px',
                        align: 'center',
                        render: (item: any) => (
                            <div className="flex gap-2 justify-center">
                                {item.durum === 'ACIK' && (
                                    <Button size="sm" variant="secondary" onClick={() => setSelectedMatch(item)}>İncele & Karar</Button>
                                )}
                                {item.durum === 'DOGRULANDI' && (
                                    <Button size="sm" variant="danger" onClick={() => handleCreateFinding(item)}>Bulgu Oluştur</Button>
                                )}
                                {item.durum !== 'ACIK' && item.durum !== 'DOGRULANDI' && (
                                    <span className="text-xs text-gray-500">İşlem Yok</span>
                                )}
                            </div>
                        )`
);

fs.writeFileSync('frontend/app/sanction/results/page.tsx', content, 'utf8');
console.log('Sanction results patched successfully.');
