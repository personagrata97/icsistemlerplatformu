const fs = require('fs');
let content = fs.readFileSync('frontend/app/audit/plan/page.tsx', 'utf8');

// 1. Add state variable
content = content.replace(
    'const [plans, setPlans] = useState<AuditPlanItem[]>([]);',
    'const [plans, setPlans] = useState<AuditPlanItem[]>([]);\n    const [riskyUnits, setRiskyUnits] = useState<any[]>([]);'
);

// 2. Fetch risky units in loadData
content = content.replace(
    `const [data, statsData, staffData] = await Promise.all([
                auditApi.getPlans({ page, pageSize: 10 }),
                auditApi.getExecutiveStats(),
                auditApi.getStaff().catch(() => [])
            ]);
            const rawPlans = data?.items || (Array.isArray(data) ? data : []);
            const total = data?.total ?? rawPlans.length;`,
    `const [data, statsData, staffData, riskyData] = await Promise.all([
                auditApi.getPlans({ page, pageSize: 10 }),
                auditApi.getExecutiveStats(),
                auditApi.getStaff().catch(() => []),
                auditApi.getRiskyUnits().catch(() => [])
            ]);
            const rawPlans = data?.items || (Array.isArray(data) ? data : []);
            const total = data?.total ?? rawPlans.length;
            setRiskyUnits(riskyData || []);`
);

// 3. Add UI
const uiAddition = `
            {/* Risky Units Warning */}
            {riskyUnits.length > 0 && (
                <div className="mb-6 space-y-3">
                    {riskyUnits.map(unit => (
                        <div key={unit.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="text-red-800 font-medium">Denetim Önceliği Yükseldi: {unit.name}</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Bu birimde <strong>{unit.failedControlCount}</strong> başarısız kontrol testi ve <strong>{unit.redKpiCount}</strong> kırmızı risk göstergesi var.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Capacity Analysis */}`;

content = content.replace('{/* Capacity Analysis */}', uiAddition);

fs.writeFileSync('frontend/app/audit/plan/page.tsx', content, 'utf8');
console.log('Patch applied successfully.');
