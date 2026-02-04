async function loadAnalytics(){
  try{
    const res = await fetch('analytics.json', {cache: 'no-store'});
    if(!res.ok) return;
    const cfg = await res.json();
    if(!cfg || !cfg.provider) return;
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
      s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${cfg.measurementId}');`;
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
// load analytics first (if configured), then posts
loadAnalytics().then(()=>loadPosts());
