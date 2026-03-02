import pandas as pd
import json
import re
import os

xlsx_path = '/Users/alexandertoporov/Documents/TCE/Registry/VROD-registry-files--2025-10.xlsx'
data_js_path = '/Users/alexandertoporov/Documents/TCE/Registry/public/data.js'

def clean_id(val):
    if pd.isna(val): return None
    return str(val).strip()

credits = {} # { prj_id: {'ci': 0, 'cr': 0} }

def add_credits(prj_id, registry=None, ci=0, cr=0):
    if not prj_id: return
    
    # Ensure ID has correct prefix if missing
    full_id = prj_id
    if registry == 'VCS' and not prj_id.startswith('VCS'):
        full_id = 'VCS' + prj_id
    elif registry == 'GOLD' and not prj_id.startswith('GS'):
        full_id = 'GS' + prj_id
    elif registry == 'ART' and not prj_id.startswith('ART'):
        full_id = 'ART' + prj_id
    
    # Handle numeric IDs coming as floats from pandas
    if full_id.endswith('.0'):
        full_id = full_id[:-2]

    if full_id not in credits:
        credits[full_id] = {'ci': 0, 'cr': 0}
    
    # Ensure ci and cr are numbers
    c_i = ci if not pd.isna(ci) else 0
    c_r = cr if not pd.isna(cr) else 0
    
    credits[full_id]['ci'] += c_i
    credits[full_id]['cr'] += c_r

# Use ExcelFile to speed up multiple reads
xl = pd.ExcelFile(xlsx_path)

# 1. ACR
print("Processing ACR...")
df_acr_i = pd.read_excel(xl, sheet_name='ACR Issuances')
for _, row in df_acr_i.iterrows():
    add_credits(clean_id(row['Project ID']), ci=row['Total Credits Issued'])

df_acr_r = pd.read_excel(xl, sheet_name='ACR Retirements')
for _, row in df_acr_r.iterrows():
    add_credits(clean_id(row['Project ID']), cr=row['Quantity of Credits'])

# 2. CAR
print("Processing CAR...")
df_car_i = pd.read_excel(xl, sheet_name='CAR Issuances')
for _, row in df_car_i.iterrows():
    add_credits(clean_id(row['Project ID']), ci=row['Total Offset Credits Issued'])

df_car_r = pd.read_excel(xl, sheet_name='CAR Retirements')
for _, row in df_car_r.iterrows():
    add_credits(clean_id(row['Project ID']), cr=row['Quantity of Offset Credits'])

# 3. ART
print("Processing ART...")
df_art_i = pd.read_excel(xl, sheet_name='ART Issuances')
for _, row in df_art_i.iterrows():
    add_credits(clean_id(row['Program ID']), registry='ART', ci=row['Quantity of Credits'])

df_art_r = pd.read_excel(xl, sheet_name='ART Retired')
for _, row in df_art_r.iterrows():
    add_credits(clean_id(row['Program ID']), registry='ART', cr=row['Quantity of Credits'])

# 4. GOLD
print("Processing GOLD...")
df_gold_i = pd.read_excel(xl, sheet_name='Gold Issuances')
for _, row in df_gold_i.iterrows():
    add_credits(clean_id(row['GSID']), registry='GOLD', ci=row['Quantity'])

df_gold_r = pd.read_excel(xl, sheet_name='Gold Retirements')
for _, row in df_gold_r.iterrows():
    add_credits(clean_id(row['GSID']), registry='GOLD', cr=row['Quantity'])

# 5. VCS (Verra)
print("Processing VCS...")
df_vcs = pd.read_excel(xl, sheet_name='Verra VCUs')
for _, row in df_vcs.iterrows():
    prj_id = clean_id(row['ID'])
    q = row['Quantity Issued'] if not pd.isna(row['Quantity Issued']) else 0
    if not pd.isna(row['Retirement/Cancellation Date']):
        add_credits(prj_id, registry='VCS', cr=q)
    else:
        add_credits(prj_id, registry='VCS', ci=q)

# 6. Apply to data.js
print("Updating public/data.js...")
with open(data_js_path, 'r') as f:
    content = f.read()

match = re.search(r'window\.PROJECTS\s*=\s*(\[.*\])\s*;?\s*$', content, re.DOTALL)
if not match:
    print("Error: Could not find window.PROJECTS")
    exit(1)

projects = json.loads(match.group(1))
updated_count = 0
for p in projects:
    prj_id = str(p.get('id'))
    if prj_id in credits:
        p['ci'] = int(credits[prj_id]['ci'])
        p['cr'] = int(credits[prj_id]['cr'])
        updated_count += 1

print(f"Updated {updated_count} projects with credits data.")

with open(data_js_path, 'w') as f:
    f.write('window.PROJECTS=')
    json.dump(projects, f, separators=(',', ':'))
    f.write(';')

print("Done!")
