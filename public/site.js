// theme toggle + copy + fuzzy filter, no deps
(function(){
  // ---- theme ----
  var btn=document.getElementById('theme-toggle');
  function label(){return document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'}
  if(btn){btn.textContent=label();
    btn.addEventListener('click',function(){
      var next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);
      try{localStorage.setItem('theme',next)}catch(e){}
      btn.textContent=label();
    });
  }
  // ---- copy ----
  document.addEventListener('click',async function(e){
    var b=e.target.closest('[data-copy]');if(!b)return;
    var orig=b.textContent;
    try{await navigator.clipboard.writeText(b.getAttribute('data-copy'));}
    catch(err){
      var t=document.createElement('textarea');
      t.value=b.getAttribute('data-copy');
      document.body.appendChild(t);t.select();
      try{document.execCommand('copy')}catch(_){}
      t.remove();
    }
    b.textContent='copied';setTimeout(function(){b.textContent=orig},1200);
  });
  // ---- fuzzy search + tag filter ----
  var q=document.getElementById('q');
  if(!q) return;
  var grid=document.getElementById('grid');
  var cards=Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var empty=document.getElementById('empty');
  var count=document.getElementById('count');
  var clear=document.getElementById('clear');
  var chips=Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var activeTag=null;
  // subsequence fuzzy score: lower is better, Infinity = no match
  function fuzzy(hay, needle){
    hay=hay.toLowerCase(); needle=needle.toLowerCase().trim();
    if(!needle) return 0;
    var hi=0, score=0, last=-1;
    for(var ni=0; ni<needle.length; ni++){
      var c=needle[ni], found=false;
      while(hi<hay.length){
        if(hay[hi]===c){
          if(last>=0) score+=(hi-last-1); // gap penalty
          last=hi; hi++; found=true; break;
        }
        hi++;
      }
      if(!found) return Infinity;
    }
    score+=last*0.01; // prefer early matches
    return score;
  }
  function apply(){
    var needle=q.value||'';
    var scored=[];
    cards.forEach(function(c){
      var tags=(c.getAttribute('data-tags')||'').split(',').filter(Boolean);
      var tagOk=!activeTag||tags.indexOf(activeTag.toLowerCase())>=0;
      if(!tagOk){c.style.display='none';return;}
      var s=fuzzy(c.getAttribute('data-search')||'',needle);
      if(s===Infinity){c.style.display='none';return;}
      scored.push({el:c,s:s});
    });
    // sort matches: best fuzzy score first (only when searching)
    if(needle.trim()) scored.sort(function(a,b){return a.s-b.s});
    var n=0;
    scored.forEach(function(o){o.el.style.display='';grid.appendChild(o.el);n++;});
    if(empty) empty.hidden=n>0;
    if(count) count.textContent=n+' shown';
    if(clear) clear.hidden=!activeTag&&!needle;
  }
  q.addEventListener('input',apply);
  chips.forEach(function(ch){
    ch.addEventListener('click',function(){
      var t=ch.getAttribute('data-tag');
      activeTag=(activeTag===t)?null:t;
      chips.forEach(function(o){o.setAttribute('aria-pressed',o.getAttribute('data-tag')===activeTag?'true':'false')});
      apply();
    });
  });
  if(clear) clear.addEventListener('click',function(){
    activeTag=null;q.value='';
    chips.forEach(function(o){o.setAttribute('aria-pressed','false')});
    apply();
  });
})();
