import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function fix() {
    const logs = await prisma.auditLog.findMany({ orderBy: { id: 'asc' } });
    let previousHash = '0';
    let fixed = 0;
    
    for (const log of logs) {
        if (!log.hash || log.hash === '0') continue;
        
        const logData = {
            user: log.user || 'System',
            action: log.action,
            details: log.details,
            targetType: log.targetType || 'General',
            targetId: log.targetId,
            changeData: log.changeData,
            ipAddress: log.ipAddress
        };
        
        const hashInput = previousHash + JSON.stringify(logData);
        const calculatedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        
        if (log.hash !== calculatedHash || log.previousHash !== previousHash) {
            await prisma.auditLog.update({
                where: { id: log.id },
                data: {
                    hash: calculatedHash,
                    previousHash: previousHash
                }
            });
            fixed++;
        }
        
        previousHash = calculatedHash;
    }
    
    console.log('Fixed ' + fixed + ' logs!');
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
