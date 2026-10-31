/* Public acquisition pages only. No form, profile, exercise or account events. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || document.getElementById('cx-privacy-button')) return;
  const cfg = script.dataset;
  const paths = (cfg.paths || '').split(',').filter(Boolean);
  const hosts = (cfg.hosts || '').split(',').filter(Boolean);
  const key = `cognixhub.${cfg.project}.consent.meta-20261031-v1`;
  const ownKey = `cognixhub.${cfg.project}.statistics-disabled`;
  const age = 180 * 86400000;
  const lang = (document.documentElement.lang || 'pt').slice(0, 2);
  const words = {
    pt: ['Preferências de privacidade', 'Publicidade opcional', 'Com a sua autorização, a Meta (Facebook e Instagram) recebe a visita a esta página pública para medir a divulgação e criar audiências de publicidade deste projeto. A Google recebe visitas para análise apenas se escolher essa opção. Não enviamos nomes, e-mails, respostas ou resultados pessoais. A escolha é opcional, dura 180 dias e pode ser retirada aqui.', 'Só essenciais', 'Aceitar publicidade', 'Personalizar', 'Publicidade Meta', 'Análise Google', 'Guardar escolhas', 'Fechar', 'Não foi possível guardar a escolha. A publicidade continua desligada.', 'Privacidade da Meta'],
    en: ['Privacy preferences', 'Optional advertising', 'With your permission, Meta (Facebook and Instagram) receives the visit to this public page to measure promotion and build advertising audiences for this project. Google receives visits for analytics only if you choose that option. We do not send names, emails, answers or personal results. Your optional choice lasts 180 days and can be withdrawn here.', 'Essential only', 'Accept advertising', 'Customise', 'Meta advertising', 'Google analytics', 'Save choices', 'Close', 'Your choice could not be saved. Advertising remains off.', 'Meta privacy'],
    fr: ['Préférences de confidentialité', 'Publicité facultative', 'Avec votre accord, Meta (Facebook et Instagram) reçoit la visite de cette page publique pour mesurer la promotion et créer des audiences pour ce projet. Google reçoit des visites uniquement si vous autorisez les statistiques. Aucun nom, e-mail, réponse ou résultat personnel n’est envoyé. Votre choix facultatif dure 180 jours et peut être retiré ici.', 'Essentiels uniquement', 'Accepter la publicité', 'Personnaliser', 'Publicité Meta', 'Statistiques Google', 'Enregistrer', 'Fermer', 'Impossible d’enregistrer votre choix. La publicité reste désactivée.', 'Confidentialité Meta'],
    es: ['Preferencias de privacidad', 'Publicidad opcional', 'Con tu permiso, Meta (Facebook e Instagram) recibe la visita a esta página pública para medir la promoción y crear audiencias para este proyecto. Google recibe visitas solo si autorizas el análisis. No enviamos nombres, correos, respuestas ni resultados personales. La elección es opcional, dura 180 días y puede retirarse aquí.', 'Solo esenciales', 'Aceptar publicidad', 'Personalizar', 'Publicidad Meta', 'Análisis Google', 'Guardar', 'Cerrar', 'No se pudo guardar la elección. La publicidad sigue desactivada.', 'Privacidad de Meta'],
    de: ['Datenschutzeinstellungen', 'Optionale Werbung', 'Mit deiner Einwilligung erhält Meta (Facebook und Instagram) den Besuch dieser öffentlichen Seite, um Werbung zu messen und Zielgruppen für dieses Projekt zu erstellen. Google erhält Besuche nur bei Zustimmung zur Analyse. Namen, E-Mails, Antworten und persönliche Ergebnisse werden nicht gesendet. Die freiwillige Wahl gilt 180 Tage und kann hier widerrufen werden.', 'Nur notwendige', 'Werbung akzeptieren', 'Anpassen', 'Meta-Werbung', 'Google-Analyse', 'Auswahl speichern', 'Schließen', 'Die Auswahl konnte nicht gespeichert werden. Werbung bleibt deaktiviert.', 'Meta-Datenschutz']
  };
  const w = words[lang] || words.en;
  const ownCopy = {
    pt: ['Contagens próprias agregadas de visitas e cliques funcionam automaticamente, sem cookies nem identificadores de visitante. Pode desativá-las nas preferências.', 'Permitir contagens próprias agregadas'],
    en: ['Our aggregate visit and click counts run automatically, without cookies or visitor identifiers. You can disable them in preferences.', 'Allow our aggregate counts'],
    fr: ['Nos comptes agrégés de visites et clics fonctionnent automatiquement, sans cookies ni identifiants de visiteurs. Vous pouvez les désactiver ici.', 'Autoriser nos comptes agrégés'],
    es: ['Nuestros recuentos agregados de visitas y clics funcionan automáticamente, sin cookies ni identificadores de visitantes. Puedes desactivarlos aquí.', 'Permitir recuentos agregados propios'],
    de: ['Unsere aggregierten Besuchs- und Klickzahlen funktionieren automatisch, ohne Cookies oder Besucherkennungen. Du kannst sie hier deaktivieren.', 'Eigene aggregierte Zählung erlauben']
  }[lang] || ['Our aggregate visit and click counts run automatically, without cookies or visitor identifiers. You can disable them in preferences.', 'Allow our aggregate counts'];
  const trackingKeys = /^(utm_(source|medium|campaign|content|term|id)|fbclid)$/;
  function eligible(url) {
    return cfg.enabled !== 'false' && hosts.includes(url.hostname) && paths.includes(url.pathname) && !url.hash &&
      [...url.searchParams.keys()].every(k => trackingKeys.test(k));
  }
  function safeReferrer() {
    if (!document.referrer) return true;
    try {
      const ref = new URL(document.referrer);
      return !ref.search && !ref.hash && (hosts.includes(ref.hostname) ? paths.includes(ref.pathname) : ref.pathname === '/');
    } catch { return false; }
  }
  function read() {
    try {
      const c = JSON.parse(localStorage.getItem(key));
      return c && c.version === 1 && c.pixel === cfg.pixel && typeof c.ads === 'boolean' && typeof c.analytics === 'boolean' &&
        Number.isFinite(c.at) && c.at <= Date.now() && Date.now() - c.at < age ? c : null;
    } catch { return null; }
  }
  function ownAllowed() {try{return localStorage.getItem(ownKey)!=='1';}catch{return true;}}
  function count(event) {
    if(!ownAllowed() || !eligible(new URL(location.href)) || !['view','entry_click'].includes(event))return;
    void fetch('https://metrics.cognixhub.com/v1/count',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({project:cfg.project,event})}).catch(()=>{});
  }
  let loaded = false;
  function cleanCookies() {
    for (const name of ['_fbp', '_fbc']) {
      for (const domain of ['', location.hostname, '.' + location.hostname, '.cognixhub.com']) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure${domain ? '; domain=' + domain : ''}`;
      }
    }
  }
  function addScript(src, id) {
    if (document.getElementById(id)) return;
    const el = document.createElement('script'); el.id = id; el.async = true; el.src = src; el.referrerPolicy = 'no-referrer';
    document.head.appendChild(el);
  }
  function start(c) {
    if (loaded || !c || !eligible(new URL(location.href)) || !safeReferrer()) return;
    // Do not disclose campaign parameters or click identifiers to third-party code.
    if (location.search) history.replaceState(history.state, '', location.pathname);
    loaded = c.ads || c.analytics;
    if (c.ads && navigator.globalPrivacyControl !== true && /^\d{10,20}$/.test(cfg.pixel || '')) {
      const q = function () { q.callMethod ? q.callMethod.apply(q, arguments) : q.queue.push(arguments); };
      q.queue = []; q.loaded = true; q.version = '2.0'; q.push = q;
      window.fbq = window._fbq = q;
      q('consent', 'revoke'); q('set', 'autoConfig', false, cfg.pixel); q('init', cfg.pixel);
      q('consent', 'grant'); q('trackSingle', cfg.pixel, 'PageView');
      addScript('https://connect.facebook.net/en_US/fbevents.js', 'cx-meta-sdk');
    }
    if (c.analytics && (cfg.ga || cfg.gtm)) {
      window.dataLayer = window.dataLayer || [];
      const gtag = function () { window.dataLayer.push(arguments); }; window.gtag = gtag;
      gtag('consent', 'default', {ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied'});
      gtag('consent', 'update', {analytics_storage:'granted'});
      if (/^G-[A-Z0-9]+$/.test(cfg.ga || '')) {
        gtag('js', new Date()); gtag('config', cfg.ga, {page_location:location.origin+location.pathname, page_referrer:'', allow_google_signals:false, allow_ad_personalization_signals:false});
        addScript('https://www.googletagmanager.com/gtag/js?id='+cfg.ga, 'cx-google-analytics');
      } else if (/^GTM-[A-Z0-9]+$/.test(cfg.gtm || '')) {
        window.dataLayer.push({'gtm.start':Date.now(), event:'gtm.js'});
        addScript('https://www.googletagmanager.com/gtm.js?id='+cfg.gtm, 'cx-google-analytics');
      }
    }
  }
  const style = document.createElement('style');
  style.textContent = '#cx-cookie-box,#cx-cookie-dialog{color:#1c2630;background:#fff;border:1px solid #bac3ce;border-radius:18px;padding:22px;box-shadow:0 8px 40px #14243222;font:15px/1.55 system-ui;box-sizing:border-box}#cx-cookie-box{position:fixed;z-index:10000;bottom:70px;left:16px;right:16px;max-width:700px;margin:auto}#cx-cookie-dialog{max-width:620px;width:calc(100% - 32px)}#cx-cookie-dialog::backdrop{background:#10182788}.cx-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}#cx-cookie-box button,#cx-cookie-dialog button,#cx-privacy-button{border:1px solid #68788b;border-radius:10px;padding:11px 15px;min-height:44px;background:#fff;color:#17394c;cursor:pointer;font:inherit}#cx-privacy-button{position:fixed;z-index:9999;bottom:12px;left:12px;font:13px system-ui}#cx-cookie-dialog label{display:block;margin:15px 0}#cx-cookie-dialog a{color:#1e5268}';
  document.head.appendChild(style);
  const button = document.createElement('button'); button.id='cx-privacy-button'; button.type='button'; button.textContent=w[0];
  const dialog = document.createElement('dialog'); dialog.id='cx-cookie-dialog'; dialog.setAttribute('aria-label',w[0]);
  const title = document.createElement('h2');title.textContent=w[0];dialog.appendChild(title);
  const description=document.createElement('p');description.textContent=ownCopy[0]+' '+w[2];dialog.appendChild(description);
  const metaLink=document.createElement('a');metaLink.href='https://www.facebook.com/privacy/policy/';metaLink.textContent=w[12];metaLink.rel='noreferrer noopener';metaLink.target='_blank';dialog.appendChild(metaLink);
  const adLabel=document.createElement('label');const ads=document.createElement('input');ads.type='checkbox';adLabel.append(ads,' '+w[6]);dialog.appendChild(adLabel);
  if(navigator.globalPrivacyControl===true)ads.disabled=true;
  const ownLabel=document.createElement('label');const own=document.createElement('input');own.type='checkbox';own.checked=ownAllowed();ownLabel.append(own,' '+ownCopy[1]);dialog.appendChild(ownLabel);
  const anLabel=document.createElement('label');const analytics=document.createElement('input');analytics.type='checkbox';anLabel.append(analytics,' '+w[7]);if(cfg.ga||cfg.gtm)dialog.appendChild(anLabel);
  const error=document.createElement('p');error.setAttribute('role','alert');dialog.appendChild(error);
  function action(parent,text,run){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',run);parent.appendChild(b);return b;}
  const actions=document.createElement('div');actions.className='cx-actions';dialog.appendChild(actions);
  function save(a,n,m=own.checked){
    if(navigator.globalPrivacyControl===true)a=false;
    if(window.fbq)window.fbq('consent','revoke');
    if(window.gtag)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(!a)cleanCookies();
    try { localStorage.setItem(ownKey,m?'0':'1');localStorage.setItem(key,JSON.stringify({version:1,pixel:cfg.pixel,ads:a,analytics:n,at:Date.now()})); }
    catch {error.textContent=w[11];return;}
    if(window.fbq)window.fbq('consent','revoke');
    if(!a)cleanCookies();
    // A fresh document removes third-party listeners after any changed choice.
    location.replace(location.pathname);
  }
  action(actions,w[3],()=>save(false,false,false));action(actions,w[8],()=>save(ads.checked,analytics.checked));action(actions,w[9],()=>dialog.close());
  function open(){const c=read();ads.checked=navigator.globalPrivacyControl!==true&&!!c?.ads;analytics.checked=!!c?.analytics;own.checked=ownAllowed();error.textContent='';dialog.showModal();}
  button.addEventListener('click',open);document.body.append(button,dialog);
  if(location.hash==='#cookie-preferences')open();
  const c=read();
  if(eligible(new URL(location.href))&&!c){
    const box=document.createElement('section');box.id='cx-cookie-box';box.setAttribute('aria-label',w[1]);
    const h=document.createElement('h2');h.textContent=w[1];const p=document.createElement('p');p.textContent=ownCopy[0]+' '+w[2];box.append(h,p);
    const row=document.createElement('div');row.className='cx-actions';box.appendChild(row);
    action(row,w[3],()=>save(false,false,false));action(row,w[4],()=>save(true,false));action(row,w[5],open);document.body.appendChild(box);
  }
  count('view');
  start(c);
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    const a=target?target.closest('a[href]'):null;
    if(target?.closest('[data-cx-entry]') || a?.classList.contains('cta') || (cfg.project==='mindwink'&&a&&/\/(register|login)\/?$/.test(new URL(a.href,location.href).pathname)))count('entry_click');
    if(!loaded)return;
    if(!a||a.target==='_blank'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const next=new URL(a.href,location.href);
    if(next.origin===location.origin&&!eligible(next)){event.preventDefault();event.stopImmediatePropagation();location.assign(next.href);}
  },true);
  window.addEventListener('hashchange',()=>{if(loaded&&!eligible(new URL(location.href))){if(window.fbq)window.fbq('consent','revoke');location.reload();}});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===ownKey||event.key===null)location.reload();});
})();
