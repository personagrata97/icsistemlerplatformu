
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();
const LOG_FILE = 'debug_log.txt';

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

async function generateDebugReport() {
    log('🚀 Starting Debug Report Generation...');

    try {
        // 1. Fetch Data
        log('📊 Fetching User (ID: 1)...');
        const user = await prisma.user.findFirst(); // Find ANY user since ID 1 might not exist
        if (!user) throw new Error('No users found in DB');
        log(`✅ User found: ${user.email} (${user.id})`);

        const period = new Date();
        log(`📅 Period: ${period.toISOString()}`);

        const startDate = new Date(period.getFullYear(), period.getMonth(), 1);
        const endDate = new Date(period.getFullYear(), period.getMonth() + 1, 0);

        log('⏳ Fetching Timesheets...');
        const timesheets = await prisma.auditTimesheet.findMany({
            where: {
                date: {
                    gte: startDate.toISOString().split('T')[0],
                    lte: endDate.toISOString().split('T')[0]
                }
            },
            include: { user: true }
        });
        log(`✅ Timesheets found: ${timesheets.length}`);

        log('📜 Fetching Logs...');
        const logs = await prisma.auditLog.findMany({
            take: 10,
            orderBy: { date: 'desc' }
        });
        log(`✅ Logs found: ${logs.length}`);

        // 2. Generate PDF
        log('📄 Generating PDF...');
        const doc = new PDFDocument({ margin: 50 });
        const outputPath = path.resolve(__dirname, 'report_debug.pdf');
        log(`💾 Output Path: ${outputPath}`);

        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);

        doc.fontSize(20).text('Debug Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated for: ${user.email}`);

        doc.moveDown();
        doc.fontSize(14).text('Timesheets');
        timesheets.forEach(t => {
            doc.text(`${t.date} - ${t.hours}h`);
        });

        doc.end();

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        });

        log('✅ PDF Generated successfully.');

    } catch (error) {
        log(`❌ ERROR: ${error}`);
        if (error instanceof Error && error.stack) {
            log(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

generateDebugReport();
