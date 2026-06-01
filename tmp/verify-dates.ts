import { formatDateTime } from './frontend/lib/audit-utils';

console.log('--- Date Verification Tests ---');

const testCases = [
    { name: 'ISO String', input: '2026-03-25T12:23:45.000Z' },
    { name: 'Turkish Date String', input: '25.03.2026' },
    { name: 'Turkish DateTime String', input: '25.03.2026 14:30:00' },
    { name: 'Turkish DateTime with Dash', input: '25.03.2026 - 14:30' },
    { name: 'Null', input: null },
    { name: 'Undefined', input: undefined },
];

testCases.forEach(tc => {
    try {
        console.log(`Test: ${tc.name.padEnd(25)} | Input: ${String(tc.input).padEnd(30)} | Output: ${formatDateTime(tc.input as any)}`);
    } catch (e: any) {
        console.log(`Test: ${tc.name.padEnd(25)} | Input: ${String(tc.input).padEnd(30)} | ERROR: ${e.message}`);
    }
});
