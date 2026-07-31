const fs = require('fs');
const cp = require('child_process');

try {
  const original = cp.execSync('git show HEAD:backend/src/audit/audit-risk.service.ts', { encoding: 'utf8' });
  fs.writeFileSync('backend/src/audit/audit-risk.service.ts', original, 'utf8');
  
  // Now apply the change carefully
  let content = original;
  content = content.replace(
      '// Pharos Control 2. Hat entegrasyonu: Etkin olmayan kontrol testleri riski yükseltir\n            const cosoControlTests = await this.controlService.getFailedTestsByDepartment(unit.name);\n            const controlPenaltyWeight = parseInt(process.env.AUDIT_CONTROL_PENALTY_WEIGHT || \'15\', 10);\n\n            if (cosoControlTests.length > 0) {\n                testPenalty += cosoControlTests.length * controlPenaltyWeight;\n            }\n\n            // --- IIA 2010 ENTEGRASYONU: MEVZUAT & RİSK MOTORU ALARMLARI ---\n            // Likidite, NPL veya Finansman Limiti gibi yasal KPI ihlallerinin denetim evreni risk puanı cezası\n            const activeRiskLogs = await this.prisma.auditLog.findMany({',
      `// Pharos Control 2. Hat entegrasyonu: Etkin olmayan kontrol testleri riski yükseltir
            const cosoControlTests = await this.controlService.getFailedTestsByDepartment(unit.name);
            
            // Ayarlardan ağırlığı al, yoksa 15 varsay
            let controlPenaltyWeight = 15;
            const controlParam = await this.prisma.auditParameter.findUnique({ where: { code: 'CONTROL_FAIL_WEIGHT' } }).catch(() => null);
            if (controlParam) controlPenaltyWeight = parseInt(controlParam.value, 10);

            if (cosoControlTests.length > 0) {
                testPenalty += cosoControlTests.length * controlPenaltyWeight;
            }

            // --- IIA 2010 ENTEGRASYONU: MEVZUAT & RİSK MOTORU ALARMLARI ---
            let riskPenaltyWeight = 15;
            const riskParam = await this.prisma.auditParameter.findUnique({ where: { code: 'RISK_RED_WEIGHT' } }).catch(() => null);
            if (riskParam) riskPenaltyWeight = parseInt(riskParam.value, 10);

            // Mevzuat göstergesi -> denetim riski. (İlgili birime ait kırmızı seviyedeki risk göstergeleri)
            const redIndicators = await this.prisma.uyari.findMany({
                where: {
                    durum: 'OPEN',
                    risk_seviyesi: { in: ['KRITIK', 'YUKSEK', 'RED'] },
                    kpi: { birim: unit.name }
                },
                include: { kpi: true }
            }).catch(() => []);

            let riskAlertPenalty = redIndicators.length * riskPenaltyWeight;

            // Eski uyarı log kontrolünü de tutuyoruz (geriye dönük uyumluluk için)
            const activeRiskLogs = await this.prisma.auditLog.findMany({`
  );
  
  content = content.replace(
      'let riskAlertPenalty = 0;\n            for (const log of activeRiskLogs) {\n                if (log.details?.includes(targetUnitId) || log.details?.includes(\'RED\') || log.details?.includes(\'LİMİT İHLALİ\')) {\n                    riskAlertPenalty += 15;\n                }\n            }',
      `for (const log of activeRiskLogs) {
                if (log.details?.includes(targetUnitId) || log.details?.includes('RED') || log.details?.includes('LİMİT İHLALİ')) {
                    riskAlertPenalty += 15;
                }
            }`
  );
  
  fs.writeFileSync('backend/src/audit/audit-risk.service.ts', content, 'utf8');
  console.log('Restored and patched audit-risk.service.ts successfully.');
} catch (e) {
  console.error(e);
}
