import streamlit as st
import requests
import pandas as pd
import time
import json
import re

# --- Page Configuration ---
st.set_page_config(page_title="Verra Contact Crawler", page_icon="📇", layout="wide")

# --- Helper Functions ---
def fetch_projects(limit=50):
    url = f"https://registry.verra.org/uiapi/resource/resource/search?$skip=0&$top={limit}&count=true"
    payload = {"program": "VCS"} 
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            val = response.json().get('value')
            if val is not None:
                return val
    except Exception as e:
        st.error(f"Failed to fetch projects: {e}")
    return list()

def get_project_details(project_id):
    url = f"https://registry.verra.org/uiapi/resource/resourceSummary/{project_id}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

def extract_contacts(participant_dict):
    emails = set()
    phones = set()
    websites = set()
    
    # 1. Extraction from Database Keys
    attributes = participant_dict.get('attributes')
    if attributes:
        for attr in attributes:
            code = str(attr.get('code', '')).upper()
            vals = attr.get('values')
            if vals:
                for v in vals:
                    val_str = str(v.get('value', '')).strip()
                    if not val_str:
                        continue
                    if 'PHONE' in code or 'TEL' in code:
                        phones.add(val_str)
                    elif 'WEB' in code or 'URL' in code:
                        websites.add(val_str)
                    elif 'EMAIL' in code:
                        if "verra.org" not in val_str.lower():
                            emails.add(val_str)

    # 2. Regex Fallback (Using \S to avoid brackets)
    dict_str = json.dumps(participant_dict)
    
    found_emails = re.findall(r'\b\S+@\S+\.\S+\b', dict_str)
    for e in found_emails:
        clean_e = e.strip('",\'')
        if "verra.org" not in clean_e.lower() and "schema.org" not in clean_e.lower():
            emails.add(clean_e)
            
    found_webs = re.findall(r'https?://\S+|www\.\S+', dict_str)
    for w in found_webs:
        clean_w = w.strip('",\'')
        if "verra.org" not in clean_w.lower() and "schema.org" not in clean_w.lower():
            websites.add(clean_w)
                    
    return ", ".join(sorted(emails)), ", ".join(sorted(phones)), ", ".join(sorted(websites))

def combine_unique(series):
    items = list()
    for val in series.dropna():
        if val:
            # Replaced list comprehensions with safe loops
            parts = str(val).split(',')
            for p in parts:
                clean_p = p.strip()
                if clean_p:
                    items.append(clean_p)
    unique_items = sorted(set(items))
    return ', '.join(unique_items)

# --- UI Layout ---
st.title("📇 Verra Proponent Contact Crawler")
st.markdown("This tool crawls through Verra projects, opens their detailed summaries, and extracts hidden **Emails, Phone Numbers, and Websites**.")

st.sidebar.header("Crawl Settings")
num_projects = st.sidebar.slider("Number of Projects to scan", min_value=10, max_value=1000, value=50, step=10)
fetch_btn = st.sidebar.button("🚀 Start Deep Crawl", type="primary")

if "df" not in st.session_state:
    st.session_state.df = pd.DataFrame()

# Main Logic
if fetch_btn:
    progress_bar = st.progress(0, text="Fetching master list of projects...")
    
    projects = fetch_projects(limit=num_projects)
    total_projects = len(projects)
    
    if total_projects == 0:
        st.error("No projects found.")
    else:
        catalog = list()
        
        for i, proj in enumerate(projects):
            progress_pct = int(((i + 1) / total_projects) * 100)
            progress_bar.progress(progress_pct, text=f"Deep scanning project {i+1} of {total_projects}...")
            
            proponent_name = proj.get('proponent') or proj.get('resourceProponent', 'Unknown')
            project_id = proj.get('resourceIdentifier')
            country = proj.get('country', 'Unknown')
            
            p_email, p_phone, p_web = "", "", ""
            
            details = get_project_details(project_id)
            if details:
                participants = details.get('participationSummaries')
                if participants:
                    for participant in participants:
                        dict_str = json.dumps(participant).lower()
                        
                        is_target = False
                        if proponent_name != 'Unknown' and proponent_name.lower() in dict_str:
                            is_target = True
                        elif 'proponent' in dict_str:
                            is_target = True
                            
                        if is_target:
                            e, p, w = extract_contacts(participant)
                            if e: p_email = e
                            if p: p_phone = p
                            if w: p_web = w
                            
            catalog.append({
                "Proponent Company": proponent_name,
                "Project ID": project_id,
                "Country": country,
                "Emails": p_email,
                "Phones": p_phone,
                "Websites": p_web
            })
            
            time.sleep(0.2)
            
        progress_bar.empty()
        raw_df = pd.DataFrame(catalog)
        
        if not raw_df.empty:
            with st.spinner("Aggregating contacts..."):
                proponents_df = raw_df.groupby('Proponent Company').agg(
                    Project_Count=('Project ID', 'count'),
                    Operating_Countries=('Country', combine_unique),
                    Emails=('Emails', combine_unique),
                    Phones=('Phones', combine_unique),
                    Websites=('Websites', combine_unique)
                ).reset_index()
                
                # Replaced bracket-filtering with safe pd.query()
                final_df = proponents_df.query("Emails != '' or Phones != '' or Websites != ''").reset_index(drop=True)
                
                st.session_state.df = final_df
                st.success(f"Scanned {total_projects} projects. Found {len(final_df)} unique proponents with contact information!")

# --- Data Display ---
if not st.session_state.df.empty:
    st.subheader("✅ Proponent Contacts Directory")
    
    st.dataframe(st.session_state.df, use_container_width=True)
    
    csv_data = st.session_state.df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Contacts CSV", 
        data=csv_data, 
        file_name="verra_proponent_contacts.csv", 
        mime="text/csv"
    )

elif fetch_btn and st.session_state.df.empty:
    st.warning("Crawled the projects, but none had contact information filled out. Try scanning a larger batch.")