import streamlit as st
import requests
import pandas as pd
import time
import json
import re
import io

# --- Page Configuration ---
st.set_page_config(page_title="Ultimate Carbon Registry Crawler v5", page_icon="🌍", layout="wide")

# ==========================================
# CORE CRAWLER ENGINES
# ==========================================

class VerraCrawler:
    def fetch_master_list(self, limit=50):
        url = f"https://registry.verra.org/uiapi/resource/resource/search?$skip=0&$top={limit}&count=true"
        payload = {"program": "VCS"} 
        headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                val = response.json().get('value')
                if val is not None:
                    return val
        except Exception as e:
            st.error(f"Verra API Error: {e}")
        return list()

    def get_project_details(self, project_id):
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
                    if not val_str:
                        continue
                    if 'PHONE' in code or 'TEL' in code:
                        phones.add(val_str)
                    elif 'WEB' in code or 'URL' in code:
                        websites.add(val_str)
                    elif 'EMAIL' in code:
                        if exclude_domain not in val_str.lower():
                            emails.add(val_str)

    dict_str = json.dumps(participant_dict)
    
    found_emails = re.findall(r'\b\S+@\S+\.\S+\b', dict_str)
    for e in found_emails:
        clean_e = e.strip('",\'')
        if exclude_domain not in clean_e.lower() and "schema.org" not in clean_e.lower():
            emails.add(clean_e)
            
    found_webs = re.findall(r'https?://\S+|www\.\S+', dict_str)
    for w in found_webs:
        clean_w = w.strip('",\'')
        if exclude_domain not in clean_w.lower() and "schema.org" not in clean_w.lower():
            websites.add(clean_w)
                    
    return ", ".join(sorted(emails)), ", ".join(sorted(phones)), ", ".join(sorted(websites))

def run_gold_standard_crawl(limit):
    # The UI URL is https://registry.goldstandard.org/projects?q=&page=1
    # Because it is built with Javascript, Python directly queries its hidden backend JSON API:
    url = f"https://public-api.goldstandard.org/projects?page=1&size={limit}"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    catalog = list()
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            projects = list()
            if isinstance(data, list):
                projects = data
            elif 'data' in data:
                projects = data.get('data')
                
            for proj in projects:
                proponent = proj.get('developer') or proj.get('project_developer') or proj.get('sustaincert_account') or 'Unknown'
                e, p, w = extract_contacts(proj, exclude_domain="goldstandard.org")
                
                catalog.append({
                    "Proponent Company": proponent,
                    "Project ID": proj.get('id', 'Unknown'),
                    "Project Name": proj.get('name', 'Unknown'),
                    "Country": proj.get('country', 'Unknown'),
                    "Emails": e,
                    "Phones": p,
                    "Websites": w
                })
    except Exception as e:
        st.error(f"Gold Standard Error: {e}")
    return catalog

def run_universal_table_crawl(registry_name):
    """Universal Engine for HTML tables like S&P Global, APX, and web portals."""
    registry_urls = dict()
    registry_urls.update({"Climate Action Reserve": "https://thereserve2.apx.com/myModule/rpt/myrpt.asp?r=111"})
    registry_urls.update({"ACR": "https://acr2.apx.com/myModule/rpt/myrpt.asp?r=111"})
    registry_urls.update({"Global Carbon Council (GCC)": "https://registry.spglobal.com/gccregistry/public/gcc"})
    registry_urls.update({"Isometric": "https://registry.isometric.com/"})
    registry_urls.update({"Cercarbono (EcoRegistry)": "https://www.ecoregistry.io/api/projects"})
    registry_urls.update({"BioCarbon Registry": "https://biocarbonregistry.com/projects"})
    registry_urls.update({"City Forest Credits": "https://www.cityforestcredits.org/carbon-registry/projects/"})
    registry_urls.update({"International Carbon Registry": "https://www.carbonregistry.com/"})
    registry_urls.update({"Carbon Standards International": "https://www.carbon-standards.com/en/projects/"})
    registry_urls.update({"Puro.earth": "https://registry.puro.earth/"})
    registry_urls.update({"Plan Vivo Foundation": "https://mer.markit.com/br-reg/public/project.jsp"})
    
    url = registry_urls.get(registry_name)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    # 1. Specialized JSON Backend Handling
    if registry_name == "Cercarbono (EcoRegistry)":
        try:
            res = requests.get(url, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                catalog = list()
                for proj in data.get('data', list()):
                    catalog.append({
                        "Proponent Company": proj.get('developerName', 'Unknown'),
                        "Project ID": proj.get('projectId', 'Unknown'),
                        "Project Name": proj.get('projectName', 'Unknown'),
                        "Country": proj.get('country', 'Unknown'),
                        "Emails": "", "Phones": "", "Websites": ""
                    })
                return catalog
        except:
            return list()

    # 2. Universal HTML Table Scraping
    try:
        res = requests.get(url, headers=headers, timeout=20)
        if res.status_code == 200:
            dfs = pd.read_html(io.StringIO(res.text))
            best_df = pd.DataFrame()
            
            # Find the largest table on the page (the project list)
            for df in dfs:
                if len(df) > len(best_df):
                    best_df = df
            
            if not best_df.empty:
                col_map = dict()
                for col in best_df.columns:
                    c_lower = str(col).lower()
                    # Mapped 'owner' specifically to catch "Project Owner" on S&P Global!
                    if 'developer' in c_lower or 'owner' in c_lower or 'account' in c_lower or 'proponent' in c_lower:
                        col_map.update({col: 'Proponent Company'})
                    elif 'project name' in c_lower or 'title' in c_lower:
                        col_map.update({col: 'Project Name'})
                    elif 'project id' in c_lower or 'id' in c_lower:
                        col_map.update({col: 'Project ID'})
                    elif 'country' in c_lower or 'state' in c_lower or 'location' in c_lower:
                        col_map.update({col: 'Country'})
                        
                best_df = best_df.rename(columns=col_map)
                
                missing = dict()
                for req in ("Proponent Company", "Project Name", "Project ID", "Country"):
                    if req not in best_df.columns:
                        missing.update({req: 'Unknown'})
                missing.update({"Emails": "", "Phones": "", "Websites": ""})
                
                best_df = best_df.assign(**missing)
                cols_to_keep = ("Proponent Company", "Project ID", "Project Name", "Country", "Emails", "Phones", "Websites")
                best_df = best_df.filter(items=cols_to_keep)
                
                return best_df.to_dict('records')
    except:
        pass # Will return empty list to trigger the manual fallback in UI
    
    return list()

# ==========================================
# DATA PROCESSING & VIEWS
# ==========================================

def combine_unique(series):
    items = list()
    for val in series.dropna():
        if val:
            parts = str(val).split(',')
            for p in parts:
                clean_p = p.strip()
                if clean_p:
                    items.append(clean_p)
    unique_items = sorted(set(items))
    return ', '.join(unique_items)

def process_projects_view(raw_data, strict_filter):
    df = pd.DataFrame(raw_data)
    if df.empty:
        return df
    if strict_filter:
        return df.query("Emails != '' or Phones != '' or Websites != ''").reset_index(drop=True)
    return df

def process_proponents_view(raw_data, strict_filter):
    df = pd.DataFrame(raw_data)
    if df.empty:
        return df
    
    agg_df = df.groupby('Proponent Company', as_index=False).agg(
        Project_Count=('Project ID', 'count'),
        Operating_Countries=('Country', combine_unique),
        Project_Names=('Project Name', combine_unique),
        Emails=('Emails', combine_unique),
        Phones=('Phones', combine_unique),
        Websites=('Websites', combine_unique)
    )
    if strict_filter:
        return agg_df.query("Emails != '' or Phones != '' or Websites != ''").reset_index(drop=True)
    return agg_df

# ==========================================
# USER INTERFACE
# ==========================================

st.sidebar.header("1. Target Setup")
available_registries = (
    "Verra", 
    "Gold Standard", 
    "Climate Action Reserve", 
    "ACR",
    "Global Carbon Council (GCC)",
    "Isometric",
    "Puro.earth",
    "Plan Vivo Foundation",
    "City Forest Credits",
    "International Carbon Registry",
    "Carbon Standards International",
    "Cercarbono (EcoRegistry)",
    "BioCarbon Registry"
)
selected_registry = st.sidebar.selectbox("Select Registry", available_registries)
crawl_target = st.sidebar.radio("View Format", ("Proponents Directory", "Projects List"))

st.sidebar.header("2. Crawl Settings")
if selected_registry in ("Verra", "Gold Standard"):
    num_projects = st.sidebar.slider("Number of Projects to scan", min_value=10, max_value=2000, value=50, step=10)
else:
    st.sidebar.info(f"📌 {selected_registry} uses a universal engine that attempts to download the entire available project table at once from its public HTML portal.")
    num_projects = 50 

st.sidebar.header("3. Contact Filtering")
strict_filter = st.sidebar.checkbox("Only show companies with found contacts", value=True)

if selected_registry not in ("Verra", "Gold Standard"):
    st.sidebar.warning(f"⚠️ **Most secondary registries do not publicly expose developer emails.** You MUST uncheck the strict filter above to see the directory, then enrich their emails using external tools.")

fetch_btn = st.sidebar.button("🚀 Start Registry Crawl", type="primary")

if "raw_data" not in st.session_state:
    st.session_state.raw_data = list()
if "current_registry" not in st.session_state:
    st.session_state.current_registry = ""

# --- Execution ---
if fetch_btn:
    st.session_state.current_registry = selected_registry
    progress_bar = st.progress(0, text=f"Connecting to {selected_registry}...")
    catalog = list()
    
    if selected_registry == "Verra":
        crawler = VerraCrawler()
        projects = crawler.fetch_master_list(limit=num_projects)
        total_projects = len(projects)
        
        if total_projects > 0:
            for i, proj in enumerate(projects):
                progress_pct = int(((i + 1) / total_projects) * 100)
                progress_bar.progress(progress_pct, text=f"Deep scanning project {i+1} of {total_projects}...")
                
                proponent_name = proj.get('proponent') or proj.get('resourceProponent', 'Unknown')
                project_id = proj.get('resourceIdentifier', 'Unknown')
                
                p_email, p_phone, p_web = "", "", ""
                details = crawler.get_project_details(project_id)
                
                if details:
                    participants = details.get('participationSummaries')
                    if participants:
                        for participant in participants:
                            dict_str = json.dumps(participant).lower()
                            if (proponent_name != 'Unknown' and proponent_name.lower() in dict_str) or ('proponent' in dict_str):
                                e, p, w = extract_contacts(participant, exclude_domain="verra.org")
                                if e: p_email = e
                                if p: p_phone = p
                                if w: p_web = w
                                
                catalog.append({
                    "Proponent Company": proponent_name,
                    "Project ID": project_id,
                    "Project Name": proj.get('resourceName', 'Unknown'),
                    "Country": proj.get('country', 'Unknown'),
                    "Emails": p_email,
                    "Phones": p_phone,
                    "Websites": p_web
                })
                time.sleep(0.15)
                
    elif selected_registry == "Gold Standard":
        progress_bar.progress(50, text="Fetching Gold Standard API... (This is fast)")
        catalog = run_gold_standard_crawl(num_projects)
        
    else:
        progress_bar.progress(50, text=f"Parsing {selected_registry} Tables... (Fetching records)")
        catalog = run_universal_table_crawl(selected_registry)
        
    progress_bar.empty()
    
    if len(catalog) > 0:
        st.session_state.raw_data = catalog
        st.success(f"Successfully loaded {len(catalog)} projects from {selected_registry}!")
    else:
        st.error(f"Failed to automatically fetch data from {selected_registry}. Their server might be utilizing Cloudflare or S&P Global enterprise firewalls to block Python scripts.")
        st.info("💡 **Manual Override:** For highly protected portals like S&P Global (GCC) and Isometric, simply open the URL in your normal web browser and use their native 'Export to CSV/Excel' button.")

# --- Display Views ---
if st.session_state.raw_data:
    st.subheader(f"✅ Viewing: {st.session_state.current_registry} - {crawl_target}")
    
    if crawl_target == "Projects List":
        final_df = process_projects_view(st.session_state.raw_data, strict_filter)
        file_name = f"{st.session_state.current_registry.replace(' ', '_').replace('.', '').lower()}_projects_list.csv"
    else:
        final_df = process_proponents_view(st.session_state.raw_data, strict_filter)
        file_name = f"{st.session_state.current_registry.replace(' ', '_').replace('.', '').lower()}_proponents_directory.csv"
        
    if final_df.empty:
        st.warning("No data found matching your filters. Try UNCHECKING 'Only show companies with found contacts' in the sidebar to see the raw directory.")
    else:
        st.dataframe(final_df, use_container_width=True)
        csv_data = final_df.to_csv(index=False).encode('utf-8')
        st.download_button(label=f"📥 Download {crawl_target} (CSV)", data=csv_data, file_name=file_name, mime="text/csv")