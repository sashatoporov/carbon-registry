import requests
import json
import re
import time
import os
import sys

# Paths
DATA_JS_PATH = '/Users/alexandertoporov/Documents/TCE/Registry/public/data.js'

def load_projects():
    if not os.path.exists(DATA_JS_PATH):
        print(f"Error: {DATA_JS_PATH} not found")
        sys.exit(1)
    with open(DATA_JS_PATH, 'r') as f:
        content = f.read()
    match = re.search(r'window\.PROJECTS\s*=\s*(\[.*\])\s*;?\s*$', content, re.DOTALL)
    if not match:
        print("Error: Could not find window.PROJECTS in data.js")
        sys.exit(1)
    return json.loads(match.group(1))

def save_projects(projects):
    with open(DATA_JS_PATH, 'w') as f:
        f.write('window.PROJECTS=')
        json.dump(projects, f, separators=(',', ':'))
        f.write(';')

def fetch_verra_details(project_id):
    url = f"https://registry.verra.org/uiapi/resource/resourceSummary/{project_id}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

def extract_contacts(participant_dict, exclude_domain="verra.org"):
    emails = set()
    phones = set()
    websites = set()
    
    attributes = participant_dict.get('attributes')
    if attributes:
        for attr in attributes:
            code = str(attr.get('code', '')).upper()
            vals = attr.get('values')
            if vals:
                for v in vals:
                    val_str = str(v.get('value', '')).strip()
                    if not val_str: continue
                    if 'PHONE' in code or 'TEL' in code: phones.add(val_str)
                    elif 'WEB' in code or 'URL' in code: websites.add(val_str)
                    elif 'EMAIL' in code and exclude_domain not in val_str.lower(): emails.add(val_str)

    dict_str = json.dumps(participant_dict)
    found_emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', dict_str)
    for e in found_emails:
        if exclude_domain not in e.lower() and "schema.org" not in e.lower():
            emails.add(e)
            
    return list(emails), list(phones), list(websites)

def extract_verra_data(details):
    data = {}
    if not details: return data
    
    # Location
    loc = details.get('location')
    if loc:
        data['lat'] = loc.get('latitude')
        data['lng'] = loc.get('longitude')
    
    # Description
    desc = details.get('description', '')
    if desc:
        data['desc'] = desc.strip()
        
    # Public Comment & Controversy
    data['public_comment'] = bool(details.get('inPublicCommentPeriod', False))
    
    controversy_keywords = ['grievance', 'controversy', 'dispute', 'complaint', 'lawsuit', 'litigation', 'protest']
    has_controversy = False
    
    desc_lower = desc.lower()
    for word in controversy_keywords:
        if word in desc_lower:
            has_controversy = True
            break
            
    # Also check documents if needed, but summary is often enough for prominent issues
    if has_controversy:
        data['has_controversy'] = True
        
    # Proponent and Contacts
    participants = details.get('participationSummaries', [])
    for p in participants:
        attrs = p.get('attributes', [])
        is_proponent = False
        prop_name = None
        for attr in attrs:
            if attr.get('code') == 'PROPONENT_NAME':
                is_proponent = True
                prop_name = attr.get('values', [{}])[0].get('value')
                break
        
        if is_proponent:
            data['proponent'] = prop_name
            emails, phones, websites = extract_contacts(p)
            if emails: data['email'] = emails[0]
            if websites: data['web_ext'] = websites[0] # External web link
            
    return data

def fetch_gold_standard_details(limit=200):
    url = f"https://public-api.goldstandard.org/projects?page=1&size={limit}"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list): return data
            if 'data' in data: return data.get('data')
    except:
        pass
    return []

def main():
    projects = load_projects()
    print(f"Loaded {len(projects)} projects")
    
    # Target top 100 projects by volume (cr + ci)
    # create a list of tuples (project, total_volume, index)
    sorted_projects = []
    for i, p in enumerate(projects):
        vol = p.get('cr', 0) + p.get('ci', 0)
        sorted_projects.append((p, vol, i))
        
    sorted_projects.sort(key=lambda x: x[1], reverse=True)
    top_100_indices = {item[2] for item in sorted_projects[:150]}
    
    print("Processing Top 150 Projects...")
    
    # Process GS early as it fetches a bulk list anyway
    gs_data = fetch_gold_standard_details(limit=200)
    gs_map = {str(d.get('id')): d for d in gs_data} if gs_data else {}
    
    processed_count = 0
    
    for i, p in enumerate(projects):
        if i not in top_100_indices:
            continue
            
        registry = p.get('registry')
        
        if registry == 'VCS':
            proj_id = p.get('id')
            if not proj_id: continue
            api_id = proj_id.replace('VCS', '').strip()
            
            print(f"  Enriching {proj_id}...")
            details = fetch_verra_details(api_id)
            if details:
                newData = extract_verra_data(details)
                if newData:
                    p.update(newData)
                    
            processed_count += 1
            time.sleep(0.5)
            
        elif registry == 'GOLD':
            proj_id = str(p.get('id', '')).replace('GS', '').strip()
            if proj_id in gs_map:
                print(f"  Enriching GS{proj_id}...")
                details = gs_map[proj_id]
                p['proponent'] = details.get('developer') or details.get('project_developer')
                desc = details.get('description', '')
                if desc:
                    p['desc'] = desc
                
                # Check for GS controversies (very basic keyword search in description)
                controversy_keywords = ['grievance', 'controversy', 'dispute', 'complaint', 'lawsuit', 'litigation', 'protest']
                if any(w in str(desc).lower() for w in controversy_keywords):
                    p['has_controversy'] = True
                    
            processed_count += 1

    save_projects(projects)
    print(f"Done! Enriched {processed_count} top projects in {DATA_JS_PATH}")

if __name__ == "__main__":
    main()
