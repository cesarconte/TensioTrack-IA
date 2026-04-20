import fs from 'fs';
import path from 'path';

const ICON_MAP: Record<string, string> = {
    'close': 'X',
    'share': 'Share2',
    'content_copy': 'Copy',
    'check': 'Check',
    'auto_awesome': 'Sparkles',
    'progress_activity': 'Loader2',
    'add': 'Plus',
    'info': 'Info',
    'schedule': 'Clock',
    'event_available': 'CalendarCheck',
    'date_range': 'Calendar',
    'expand_more': 'ChevronDown',
    'assignment_ind': 'UserCheck',
    'calendar_today': 'Calendar',
    'bar_chart': 'BarChart3',
    'verified_user': 'ShieldCheck',
    'arrow_forward': 'ArrowRight',
    'psychology': 'BrainCircuit',
    'monitoring': 'Activity',
    'favorite': 'Heart',
    'trending_up': 'TrendingUp',
    'trending_down': 'TrendingDown',
    'trending_flat': 'Minus',
    'person': 'User',
    'settings': 'Settings',
    'logout': 'LogOut',
    'dashboard': 'LayoutDashboard',
    'history': 'History',
    'description': 'FileText',
    'dark_mode': 'Moon',
    'light_mode': 'Sun',
    'refresh': 'RefreshCw',
    'analytics': 'Activity',
    'view_stream': 'LayoutList',
    'speed': 'Activity',
    'tune': 'SlidersHorizontal',
    'check_circle': 'CheckCircle2',
    'restart_alt': 'RefreshCw',
    'notes': 'StickyNote',
    'edit': 'Edit3',
    'delete': 'Trash2',
    'chevron_right': 'ChevronRight',
    'chevron_left': 'ChevronLeft',
    'filter_list': 'Filter',
    'data_usage': 'PieChart',
    'medical_services': 'Stethoscope',
    'arrow_back': 'ArrowLeft',
    'upload': 'Upload',
    'photo_camera': 'Camera',
    'cake': 'Cake',
    'scale': 'Scale',
    'straighten': 'Ruler',
    'save': 'Save',
    'download': 'Download',
    'public': 'Globe',
    'warning': 'AlertTriangle',
    'science': 'FlaskConical',
    'dns': 'Server',
    'lock': 'Lock',
    'shield': 'Shield',
    'fingerprint': 'Fingerprint',
    'flag': 'Flag',
    'gavel': 'Gavel',
    'calendar_month': 'CalendarDays',
    'chat': 'MessageCircle',
    'smart_toy': 'Bot',
    'send': 'Send',
    'sync': 'RefreshCw',
    'login': 'LogIn',
    'local_cafe': 'Coffee',
    'menu_book': 'Book',
    'error': 'AlertCircle',
    'mic': 'Mic',
    'mic_off': 'MicOff',
    'remove': 'Minus'
};

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('material-symbols-outlined')) return;

    let modified = false;
    const importsToAdd = new Set<string>();

    const regex = /<span\s+className=(?:\{cn\("([^"]*material-symbols-outlined[^"]*)",\s*([^)]*)\)\}|"([^"]*material-symbols-outlined[^"]*)")(?:\s+style=\{([^}]*)\})?>\s*(?:\{([^{}]*)\}|([^<]*))\s*<\/span>/g;

    content = content.replace(regex, (match, cnClasses1, cnExp, classes2, styleStr, dynamicValue, staticValue) => {
        let classes = (cnClasses1 || classes2 || '').replace('material-symbols-outlined', '').trim();
        const value = (dynamicValue || staticValue || '').trim();
        
        let cnExpression = cnExp ? cnExp.trim() : null;
        let finalClassesCode = '';
        if (cnExpression) {
             if (classes) {
                 finalClassesCode = `className={cn("${classes}", ${cnExpression})}`;
             } else {
                 finalClassesCode = `className={cn(${cnExpression})}`;
             }
        } else {
             finalClassesCode = `className="${classes}"`;
        }

        // Keep style if exists
        const styleProp = styleStr ? ` style={${styleStr}}` : '';

        if (dynamicValue) {
             // We can't statically know the value, so we'll just return the original if it's dynamic like '{icon}'
             // However, for Dashboard.tsx, the dynamic icons are limited. Let's just create a dynamic wrapper.
             return match; 
        }

        const lucideIcon = ICON_MAP[value] || 'Circle';
        importsToAdd.add(lucideIcon);
        modified = true;

        return `<${lucideIcon} ${finalClassesCode}${styleProp} />`;
    });

    if (modified) {
        if (importsToAdd.size > 0 && !content.includes('from "lucide-react"')) {
            const importStatement = `import { ${Array.from(importsToAdd).join(', ')} } from "lucide-react";\n`;
            // Insert after the last import
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex > -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex);
                content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
            } else {
                content = importStatement + content;
            }
        } else if (importsToAdd.size > 0) {
            // Check if existing import can be appended
            const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["'];/;
            const existingImportMatch = content.match(importRegex);
            if (existingImportMatch) {
                const existingImports = existingImportMatch[1].split(',').map(s => s.trim());
                const newImports = Array.from(importsToAdd).filter(imm => !existingImports.includes(imm));
                if (newImports.length > 0) {
                     const updatedImports = [...existingImports, ...newImports].join(', ');
                     content = content.replace(existingImportMatch[0], `import { ${updatedImports} } from "lucide-react";`);
                }
            }
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No static replacements in ${filePath}`);
    }
}

function traverseDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

traverseDir('./src');
