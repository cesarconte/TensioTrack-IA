import re
import os

ICON_MAP = {
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
    'analytics': 'Activity'
}

def map_icon_name(name):
    return ICON_MAP.get(name.strip(), 'Circle') # fallback to Circle

def convert_span_to_lucide(match):
    full_match = match.group(0)
    classes = match.group(1).replace('material-symbols-outlined', '').strip()
    # sometimes there are nested variables or expressions in classes but let's assume it's simple or preserve it
    icon_content = match.group(2).strip()
    
    if icon_content.startswith('{') and icon_content.endswith('}'):
        # Dynamic icon
        var_name = icon_content[1:-1]
        return f'<DynamicLucideIcon name={{{var_name}}} className="{classes}" />'
        
    lucide_comp = map_icon_name(icon_content)
    return f'<{lucide_comp} className="{classes}" />'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'material-symbols-outlined' not in content:
        return

    # Complex regex to handle <span className="material-symbols-outlined and other classes">icon_name</span>
    # and <span className={cn("material-symbols-outlined", ...)}>icon_name</span>
    
    # Actually, let's just do it step by step manually or with a simpler regex for the exact strings in the project.
    
    print(f"File: {filepath} needs processing")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
