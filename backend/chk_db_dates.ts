
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


import * as fs from 'fs';

const LOG_FILE = 'debug_dates.txt';
function log(msg: string) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function main() {
    fs.writeFileSync(LOG_FILE, '📊 Checking Database Date Ranges...\n');

    try {
        const auditCount = await prisma.audit.count();
        const timesheetCount = await prisma.auditTimesheet.count();
        const logCount = await prisma.auditLog.count();

        log(`\nCounts:`);
        log(`- Audits: ${auditCount}`);
        log(`- Timesheets: ${timesheetCount}`);
        log(`- Logs: ${logCount}`);

        if (auditCount > 0) {
            const first = await prisma.audit.findFirst({ orderBy: { created_at: 'asc' } });
            const last = await prisma.audit.findFirst({ orderBy: { created_at: 'desc' } });
            log(`\nAudits Range: ${first?.created_at} - ${last?.created_at}`);
        }

        if (timesheetCount > 0) {
            const first = await prisma.auditTimesheet.findFirst({ orderBy: { date: 'asc' } });
            const last = await prisma.auditTimesheet.findFirst({ orderBy: { date: 'desc' } });
            log(`\nTimesheets Range: ${first?.date} - ${last?.date}`);
        }

        if (logCount > 0) {
            const first = await prisma.auditLog.findFirst({ orderBy: { date: 'asc' } });
            const last = await prisma.auditLog.findFirst({ orderBy: { date: 'desc' } });
            log(`\nLogs Range: ${first?.date} - ${last?.date}`);
        }

    } catch (e) {
        log(`ERROR: ${e}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
