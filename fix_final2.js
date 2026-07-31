const fs = require('fs');

// Fix universe/[unitId]/page.tsx ActionMenu error
let universe = fs.readFileSync('frontend/app/audit/universe/[unitId]/page.tsx', 'utf8');
universe = universe.replace(/import ActionMenu from '@\/components\/ui\/ActionMenu';\n/, '');
fs.writeFileSync('frontend/app/audit/universe/[unitId]/page.tsx', universe, 'utf8');

// Fix organization/page.tsx
let org = fs.readFileSync('frontend/app/settings/organization/page.tsx', 'utf8');
org = org.replace(
`    const renderTree = (nodes: OrgNode[], level = 0) => {
        return (
                        <div key={node.id} className="animate-in fade-in zoom-in-95 duration-200">`,
`    const renderTree = (nodes: OrgNode[], level = 0) => {
        return (
            <div className="space-y-1">
                {nodes.map((node) => {
                    const hasChildren = node.children && node.children.length > 0;
                    const isExpanded = expandedNodes[node.id];
                    return (
                        <div key={node.id} className="animate-in fade-in zoom-in-95 duration-200">`
);
fs.writeFileSync('frontend/app/settings/organization/page.tsx', org, 'utf8');
