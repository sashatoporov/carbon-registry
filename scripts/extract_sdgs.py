import pandas as pd
import json
import re

def extract_sdg_numbers(text):
    if pd.isna(text):
        return []
    if isinstance(text, (int, float)):
        return [int(text)]
    # Match numbers 1-17
    # For formats like "03: Good Health", "8,7,4", "Goal 1" etc.
    found = re.findall(r'\b(0?[1-9]|1[0-7])\b', str(text))
    return sorted(list(set(int(n) for n in found)))

xlsx_file = 'VROD-registry-files--2025-10.xlsx'
mapping = {}

# Process Gold Projects
try:
    df_gold = pd.read_excel(xlsx_file, sheet_name='Gold Projects', usecols=['GSID', 'Sustainable Development Goals'])
    for _, row in df_gold.iterrows():
        gsid = str(row['GSID'])
        if not gsid or gsid == 'nan': continue
        sdgs = extract_sdg_numbers(row['Sustainable Development Goals'])
        if sdgs:
            mapping[f"GS{gsid}"] = sdgs
except Exception as e:
    print(f"Error processing Gold: {e}")

# Process ACR Projects
try:
    df_acr = pd.read_excel(xlsx_file, sheet_name='ACR Projects', usecols=['Project ID', 'Sustainable Development Goal(s)'])
    for _, row in df_acr.iterrows():
        id = str(row['Project ID'])
        if not id or id == 'nan': continue
        sdgs = extract_sdg_numbers(row['Sustainable Development Goal(s)'])
        if sdgs:
            mapping[id] = sdgs
except Exception as e:
    print(f"Error processing ACR: {e}")

# Process CAR Projects
try:
    df_car = pd.read_excel(xlsx_file, sheet_name='CAR Projects', usecols=['Project ID', 'SDG Impact'])
    for _, row in df_car.iterrows():
        id = str(row['Project ID'])
        if not id or id == 'nan': continue
        sdgs = extract_sdg_numbers(row['SDG Impact'])
        if sdgs:
            mapping[id] = sdgs
except Exception as e:
    print(f"Error processing CAR: {e}")

with open('src/data/sdg_mapping.json', 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"Successfully mapped {len(mapping)} projects.")
