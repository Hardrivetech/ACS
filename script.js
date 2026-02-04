async function loadAnalytics(){
  try{
    const res = await fetch('analytics.json', {cache: 'no-store'});
    if(!res.ok) return;
    const cfg = await res.json();
    if(!cfg || !cfg.provider) return;
    const requireConsent = cfg.requireConsent !== false; // default true
    if(requireConsent && localStorage.getItem('analytics_consent') !== 'granted'){
      // consent required but not granted yet
      return;
    }
    if(cfg.provider === 'plausible'){
      const s = document.createElement('script');
      s.async = true; s.defer = true;
      s.src = 'https://plausible.io/js/plausible.js';
      if(cfg.domain) s.setAttribute('data-domain', cfg.domain);
      document.head.appendChild(s);
    } else if(cfg.provider === 'ga4'){
      if(!cfg.measurementId) return;
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.measurementId}`;
      document.head.appendChild(s1);
      const s2 = document.createElement('script');
      // enable anonymize_ip where supported
      const anonymize = cfg.anonymize_ip === true ? `, {'anonymize_ip': true}` : '';
      s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${cfg.measurementId}'${anonymize});`;
      document.head.appendChild(s2);
    }
  }catch(e){
    console.warn('analytics load failed', e);
  }
}

async function loadPosts(){
  const container = document.getElementById('posts');
  try{
    const res = await fetch('posts.json', {cache: 'no-store'});
    const data = await res.json();
    if(!Array.isArray(data) || data.length===0){
      container.innerHTML = '<p>No posts yet. The aggregator will populate this soon.</p>';
      return;
    }
    container.innerHTML = '';
    data.slice(0,30).forEach(p => {
      const el = document.createElement('article'); el.className='post';
      const title = escapeHtml(p.title || 'No title');
      const summary = p.summary ? p.summary : '';
      const meta = [p.source, p.published].filter(Boolean).join(' • ');
      el.innerHTML = `\
        <h3 class="post-title"><a href="${p.link}" target="_blank" rel="noopener noreferrer">${title}</a></h3>\
        <div class="post-meta">${escapeHtml(meta)}</div>\
        <p class="post-summary">${summary}</p>`;
      container.appendChild(el);
    });
  }catch(e){
    container.innerHTML = '<p>Error loading posts.</p>';
    console.error(e);
  }
}
function escapeHtml(s){
  if(!s) return '';
  return s.replace(/[&<>\"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}
// Consent banner handling
function showConsentBanner(){
  const banner = document.getElementById('consent-banner');
  if(!banner) return;
  banner.hidden = false;
  document.getElementById('consent-accept').addEventListener('click', ()=>{
    localStorage.setItem('analytics_consent','granted');
    banner.hidden = true;
    loadAnalytics().then(()=>{});
  });
  document.getElementById('consent-decline').addEventListener('click', ()=>{
    localStorage.setItem('analytics_consent','denied');
    banner.hidden = true;
  });
}

async function initSite(){
  // decide whether to show consent banner
  try{
    const res = await fetch('analytics.json', {cache: 'no-store'});
    if(res.ok){
      const cfg = await res.json();
      const requireConsent = cfg.requireConsent !== false;
      const consent = localStorage.getItem('analytics_consent');
      if(requireConsent && consent !== 'granted' && consent !== 'denied'){
        showConsentBanner();
      } else if(consent === 'granted' || !requireConsent){
        await loadAnalytics();
      }
    }
  }catch(e){
    // ignore
  }
  // finally load posts
  await loadPosts();
}

initSite();

// allow reopening consent banner via footer link
document.addEventListener('DOMContentLoaded', ()=>{
  const link = document.getElementById('analytics-settings');
  if(!link) return;
  link.addEventListener('click', (e)=>{
    e.preventDefault();
    // show banner to allow changing consent
    const banner = document.getElementById('consent-banner');
    if(banner){
      banner.hidden = false;
    } else {
      alert('Consent UI not available');
    }
  });
});

// revoke consent: clear analytics cookies and set denied
function clearAnalyticsCookies(){
  try{
    const cookies = document.cookie.split(';').map(c=>c.trim());
    const patterns = [/^_ga(?:_.*)?$/i, /^_gid$/i, /^_gcl_au$/i, /^_gat(?:_.*)?$/i];
    cookies.forEach(c => {
      const name = c.split('=')[0];
      if(patterns.some(rx=>rx.test(name))){
        // delete for current domain
        document.cookie = name + '=; Max-Age=0; path=/;';
        // try deleting with domain
        try{ document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname + ';'; }catch(e){}
      }
    });
    // remove any gtag function if present
    if(window.gtag && typeof window.gtag === 'function'){
      try{ window.gtag('consent','update',{ 'analytics_storage':'denied' }); }catch(e){}
    }
  }catch(e){
    console.warn('clearAnalyticsCookies error', e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const revoke = document.getElementById('consent-revoke');
  if(!revoke) return;
  revoke.addEventListener('click', (e)=>{
    e.preventDefault();
    localStorage.setItem('analytics_consent','denied');
    clearAnalyticsCookies();
    alert('Analytics consent revoked. Analytics cookies removed.');
  });
});
