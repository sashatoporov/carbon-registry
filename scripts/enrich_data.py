import pandas as pd
import json
import re
import os

main_xlsx = '/Users/alexandertoporov/Documents/TCE/Registry/.backup/Voluntary-Registry-Offsets-Database--v2025-12-year-end.xlsx'
registry_xlsx = '/Users/alexandertoporov/Documents/TCE/Registry/VROD-registry-files--2025-10.xlsx'
data_js_path = '/Users/alexandertoporov/Documents/TCE/Registry/public/data.js'

def clean_val(val):
    if pd.isna(val) or str(val).lower() in ['nan', 'nat', 'none', '-', 'nan', 'nan ']:
        return None
    return str(val).strip()

def clean_date(val):
    if pd.isna(val) or str(val).lower() in ['nan', 'nat', 'none', '-', 'nan', 'nan ']:
        return None
    try:
        if isinstance(val, (pd.Timestamp, pd.datetime)):
            return val.strftime('%Y-%m-%d')
        dt = pd.to_datetime(val)
        return dt.strftime('%Y-%m-%d')
    except:
        return str(val).strip()

enrichment = {}

# 1. Load from primary aggregate file
print("Loading primary aggregate file...")
df_main = pd.read_excel(main_xlsx, sheet_name='PROJECTS', header=3)
for _, row in df_main.iterrows():
    prj_id = clean_val(row['Project ID'])
    if not prj_id: continue
    enrichment[prj_id] = {
        'web': clean_val(row['Project Website']),
        'docs_url': clean_val(row['Registry Documents']),
        'proponent': clean_val(row['Project Owner ']),
        'oper': clean_val(row['Offset Project Operator ']),
        'dt_list': clean_date(row['Project Listed']),
        'dt_reg': clean_date(row['Project Registered ']),
        'desig': clean_val(row['Authorized Project Designee']),
        'verif': clean_val(row['Verifier'])
    }

# 2. Augment from registry-specific file
print("Augmenting from registry-specific file...")
reg_sheets = {
    'ACR Projects': {'id': 'Project ID', 'web': 'Project Website'},
    'CAR Projects': {'id': 'Project ID', 'web': 'Project Website'},
    'ART Projects': {'id': 'Project ID', 'web': 'Program Website'},
    'Verra Projects': {'id': 'ID', 'web': None},
    'Gold Projects': {'id': 'GSID', 'web': None}
}

for sheet, mapping in reg_sheets.items():
    print(f"  Checking {sheet}...")
    try:
        df_reg = pd.read_excel(registry_xlsx, sheet_name=sheet)
        for _, row in df_reg.iterrows():
            prj_id = clean_val(row[mapping['id']])
            if not prj_id: continue
            
            if prj_id not in enrichment:
                enrichment[prj_id] = {}
            
            # Update web if missing
            if mapping['web'] and mapping['web'] in row:
                web = clean_val(row[mapping['web']])
                if web and not enrichment[prj_id].get('web'):
                    enrichment[prj_id]['web'] = web
            
            # Try to find registration date if missing
            date_col = next((c for c in df_reg.columns if 'reg' in c.lower() and ('date' in c.lower() or 'registered' in c.lower())), None)
            if date_col and not enrichment[prj_id].get('dt_reg'):
                 dt = clean_date(row[date_col])
                 if dt: enrichment[prj_id]['dt_reg'] = dt
    except Exception as e:
        print(f"    Error reading {sheet}: {e}")

# 3. Apply to data.js
print("Reading public/data.js...")
with open(data_js_path, 'r') as f:
    content = f.read()

match = re.search(r'window\.PROJECTS\s*=\s*(\[.*\])\s*;?\s*$', content, re.DOTALL)
if not match:
    print("Error: Could not find window.PROJECTS")
    exit(1)

projects = json.loads(match.group(1))
updated_count = 0
web_count = 0
for p in projects:
    prj_id = p.get('id')
    if prj_id in enrichment:
        e = enrichment[prj_id]
        for key in ['web', 'docs_url', 'proponent', 'oper', 'dt_list', 'dt_reg', 'desig']:
            if e.get(key):
                p[key] = e[key]
        updated_count += 1
        if p.get('web'): web_count += 1

print(f"Enriched {updated_count} projects. Total projects with web: {web_count}")

with open(data_js_path, 'w') as f:
    f.write('window.PROJECTS=')
    json.dump(projects, f, separators=(',', ':'))
    f.write(';')
print("Done!")
