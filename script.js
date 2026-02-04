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
loadPosts();
