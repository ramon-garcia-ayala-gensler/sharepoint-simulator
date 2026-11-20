/*
 * sp-builder.js  ·  helpers para armar páginas modernas de SharePoint por REST desde la consola/extensión de Chrome.
 *
 * CARGA (una vez por pestaña de SharePoint, dentro de TU sitio):
 *   window.SPB_CONFIG={site:'/sites/MI-SITIO',assets:'Assets',templates:{learning:'PlantillaHome',powerApp:'PlantillaPowerApps',embed:'PlantillaEmbed',v2:'PlantillaWebParts'}}   // ajusta a tu sitio
 *   eval(await fetch('http://localhost:8766/sp-builder.js').then(r=>r.text()))     // el puente local (tools/serve-cors.py) sirve esta carpeta
 *   await SPB.init()                                                               // lee plantillas -> window.TPL
 *
 * USO:
 *   SPB.begin();                                                  // reinicia zonas (zoneId por zona)
 *   const P = SPB.pos;                                            // pos(zone, section, factor, emphasis, control)
 *   const c = [
 *     await SPB.assets() una vez; luego SPB.img('x.png','alt','https://link', P(1,1,12,0,1)),     // imagen de tu biblioteca de imágenes (uniqueId y tamaño reales)
 *     SPB.image('/sites/MI-SITIO/tu biblioteca de imágenes/x.png','alt','https://link', P(1,1,12,0,1)),   // versión de bajo nivel
 *     SPB.text('<h2>Titulo</h2><p>Texto</p>', P(2,1,12,0,1)),
 *     SPB.quickLinks([{title,desc,url,img,newTab}], 'Filmstrip'|'Compact'|'List'|'Button'|'Grid', P(...), {title}),
 *     SPB.people(['persona1@tudominio.com',...], P(...), {title}),
 *     SPB.events(P(...), {title, list:'Events', layout:'Compact'}),
 *     SPB.hc({kind:'carousel'|'cards', type:'pages'|'videos'|'news'|'documents', words:'Case', title, max}, P(...)),  // Highlighted content
 *     SPB.news({props:{}}, P(...)),                                 // News (plantilla de PlantillaWebParts)
 *     SPB.divider(P(...)), SPB.spacer(P(...)), SPB.button('Label','url',P(...)),
 *     SPB.powerApp('<GUID de la app>', 600, P(...)),
 *     SPB.embed('https://url-microsoft', 600, P(...)),
 *   ];
 *   const id = await SPB.createOrGetPage('MiPagina','MiPagina');    // devuelve el Id (item de Site Pages); crea borrador si no existe
 *   await SPB.save(id,'MiPagina',c);                              // SavePageAsDraft (NO publica)
 *
 * pos(zone, section, factor, emphasis, control):
 *   zone    = zoneIndex (1..n, una por "sección" visual), section = columna dentro de la zona (1..3),
 *   factor  = sectionFactor (12 = 1 col; 8 + 4 = 2/3-1/3; 4 + 8 = 1/3-2/3; 6 + 6 = 2 col; 4+4+4 = 3 col),
 *   emphasis= fondo de zona 0 ninguno | 1 neutral | 2 soft | 3 strong (zoneEmphasis, orden PnP: Neutral=1, Soft=2, Strong=3), control = controlIndex en la columna (1..n).
 *   Todos los web parts de una zona deben llevar el mismo emphasis.
 *
 * Plantillas: window.TPL.{quickLinks,people,events,divider,button,powerApp,embed,hero,hc,image} (JSON de controles leídos de
 *   tus páginas de plantilla (ver SPB_CONFIG.templates) y, si existen, de MiPagina para image/hc).
 */
(function () {
  const CFG = window.SPB_CONFIG || {};
  const S = CFG.site || '/sites/MI-SITIO';   // @personalizar: ruta relativa de tu sitio
  const TPLP = Object.assign({ learning:'PlantillaHome', powerApp:'PlantillaPowerApps', embed:'PlantillaEmbed', v2:'PlantillaWebParts' }, CFG.templates || {});
  const J = { Accept: 'application/json;odata=nometadata' };
  const ID = {
    quickLinks: 'c70391ea-0b10-4ee9-b2b4-006d3fcad0cd', people: '7f718435-ee4d-431c-bdbf-9c4ff326f46e',
    events: '20745d7d-8581-4a6c-bf26-68279bc123fc', divider: '2161a1c6-db61-4731-b97c-3cdb303f7cbb',
    button: '0f087d7f-520e-42b7-89c0-496aaf979d58', hero: 'c4bd7b2f-7b6e-4599-8485-16504575f590',
    image: 'd1d91016-032f-456d-98a4-721247c305e8', hc: 'daf0b71c-6de8-4ef7-b511-faae7c388708',
    news: '8c88f208-6c77-4bdb-86a0-0c47b4316588', powerApp: '9d7e898c-f1bb-473a-9ace-8b415036578b',
    embed: '490d7c76-1824-45b2-9de3-676421c997fa', spacer: '8654b779-4886-46d4-9ac3-aa7e5ccc4cb4'
  };
  const guid = () => crypto.randomUUID();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const SPB = (window.SPB = window.SPB || {});
  window.TPL = window.TPL || {};
  SPB.ID = ID; SPB.S = S; SPB._zones = {}; SPB.REC = SPB.REC || {};

  SPB.guid = guid;
  SPB.begin = () => { SPB._zones = {}; };
  SPB.digest = async () => {
    const d = await fetch(S + '/_api/contextinfo', { method: 'POST', headers: J }).then((r) => r.json());
    SPB.DG = d.FormDigestValue; return SPB.DG;
  };
  SPB.api = async (path, method = 'GET', body) => {
    if (!SPB.DG) await SPB.digest();
    const h = Object.assign({ 'X-RequestDigest': SPB.DG }, J);
    if (body !== undefined) h['Content-Type'] = 'application/json;odata=nometadata';
    const r = await fetch(S + '/_api/' + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const t = await r.text();
    if (!r.ok) throw new Error(r.status + ' ' + t.slice(0, 300));
    return t ? JSON.parse(t) : {};
  };

  // ---------- plantillas ----------
  SPB.init = async () => {
    await SPB.digest();
    const canvas = async (p) => JSON.parse((await SPB.api("sitepages/pages/GetByUrl('SitePages/" + p + ".aspx')?$select=CanvasJson1")).CanvasJson1);
    const L = await canvas(TPLP.learning);
    const by = (arr, id) => arr.find((c) => c.webPartId === id);
    const keep = (c) => (c ? clone(c) : null);
    Object.assign(window.TPL, {
      quickLinks: keep(by(L, ID.quickLinks)), people: keep(by(L, ID.people)), events: keep(by(L, ID.events)),
      divider: keep(by(L, ID.divider)), button: keep(by(L, ID.button)), hero: keep(by(L, ID.hero))
    });
    try { window.TPL.powerApp = keep((await canvas(TPLP.powerApp)).find((c) => c.controlType === 3)); } catch (e) {}
    try { window.TPL.embed = keep((await canvas(TPLP.embed)).find((c) => c.controlType === 3)); } catch (e) {}
    try { // image, hc (Carousel y Card) y news: se leen de la página de plantillas PlantillaWebParts (agregados una vez por la UI)
      const V = await canvas(TPLP.v2);
      const im = V.find((c) => c.webPartId === ID.image), nw = V.find((c) => c.webPartId === ID.news);
      const hcs = V.filter((c) => c.webPartId === ID.hc);
      if (im) window.TPL.image = clone(im);
      if (nw) window.TPL.news = clone(nw);
      hcs.forEach((h) => { if (h.webPartData.properties.layoutId === 'Carousel') window.TPL.hc = clone(h); else window.TPL.hcCards = clone(h); });
    } catch (e) {}
    // directorio de personas reales (cuentas M365) disponibles en las plantillas
    L.filter((c) => c.webPartId === ID.people).forEach((c) => {
      const wd = c.webPartData, t = wd.serverProcessedContent.searchablePlainTexts;
      (wd.properties.persons || []).forEach((p, i) => {
        const n = t['persons[' + i + '].name'];
        if (n && !SPB.REC[n]) SPB.REC[n] = { p: clone(p), name: n, email: t['persons[' + i + '].email'] };
      });
    });
    return Object.keys(window.TPL).filter((k) => window.TPL[k]);
  };

  // ---------- posición ----------
  SPB.pos = (zone, section, factor, emphasis, control) => {
    if (!SPB._zones[zone]) SPB._zones[zone] = guid();
    return {
      position: { layoutIndex: 1, zoneIndex: zone, zoneId: SPB._zones[zone], sectionIndex: section, sectionFactor: factor, controlIndex: control },
      emphasis: emphasis ? { zoneEmphasis: emphasis } : {}
    };
  };
  const wrap = (p, extra) => Object.assign({ position: p.position, emphasis: p.emphasis }, extra);
  const wp = (idKey, p, data, extra) => {
    const iid = guid();
    data.id = ID[idKey]; data.instanceId = iid;
    return wrap(p, Object.assign({ id: iid, controlType: 3, isFromSectionTemplate: false, addedFromPersistedData: true, webPartId: ID[idKey], webPartData: data }, extra || {}));
  };
  const fromTpl = (key) => { if (!window.TPL[key]) throw new Error('Falta plantilla ' + key + ' (corre SPB.init o agrega el web part por la UI en MiPagina)'); return clone(window.TPL[key].webPartData); };
  const rel = (u) => u.replace(location.origin, '');

  // ---------- fábricas ----------
  SPB.text = (html, p) => wrap(p, { controlType: 4, id: guid(), innerHTML: html, addedFromPersistedData: true, editorType: 'CKEditor' });

  SPB.divider = (p) => wp('divider', p, fromTpl('divider'));
  // El GUID del web part Spacer no se pudo confirmar (3 candidatos no renderizan): se usa un Text vacío como separador.
  SPB.spacer = (p, h) => SPB.text('<p>' + '&nbsp;'.repeat(1) + '</p>', p);

  SPB.button = (label, url, p) => {
    const d = fromTpl('button'); d.serverProcessedContent.searchablePlainTexts.label = label;
    d.serverProcessedContent.links.linkUrl = url; return wp('button', p, d);
  };

  // image: url = ruta en la biblioteca (por ejemplo /sites/.../tu biblioteca de imágenes/x.png). opts: {uniqueId, width, height, caption}
  SPB.image = (url, alt, link, p, o) => {
    o = o || {}; const u = encodeURI(rel(url));
    const base = window.TPL.image ? clone(window.TPL.image.webPartData) : {
      title: 'Image', description: 'Add an image, picture or photo to your page.', audiences: [], hideOn: { mobile: false }, dataVersion: '1.8',
      properties: { imageSourceType: 2, captionText: '', altText: '', linkUrl: '', overlayText: '', fileName: '', siteId: '', webId: '', listId: '', uniqueId: '', imgWidth: 0, imgHeight: 0, isDecorative: false },
      serverProcessedContent: { htmlStrings: {}, searchablePlainTexts: {}, imageSources: {}, links: {} }
    };
    const pr = base.properties, spc = base.serverProcessedContent;
    Object.assign(pr, { imageSourceType: 2, fileName: decodeURIComponent(u.split('/').pop()), captionText: o.caption || '', altText: alt || '', linkUrl: link || '', overlayText: '' }, o.props || {});
    if (o.uniqueId) pr.uniqueId = o.uniqueId;
    if (o.width) { pr.imgWidth = o.width; pr.imgHeight = o.height; }
    if (o.siteId) { pr.siteId = o.siteId; pr.webId = o.webId; pr.listId = o.listId; }
    spc.imageSources = { imageSource: u };
    spc.searchablePlainTexts = Object.assign({}, spc.searchablePlainTexts, { altText: alt || '', captionText: o.caption || '' });
    spc.links = link ? { baseUrl: S, linkUrl: link } : { baseUrl: S };
    return wp('image', p, base);
  };

  // items: [{title, desc, url, img, alt, newTab, icon}]
  SPB.quickLinks = (items, layout, p, o) => {
    o = o || {};
    const d = fromTpl('quickLinks'), spc = d.serverProcessedContent, pr = d.properties;
    const prevIcon = (pr.items || [])[1] || (pr.items || [])[0] || {};
    spc.searchablePlainTexts = {}; spc.links = { baseUrl: S }; spc.imageSources = {};
    if (o.title) spc.searchablePlainTexts.title = o.title;
    pr.items = items.map((it, i) => {
      spc.searchablePlainTexts['items[' + i + '].title'] = it.title;
      if (it.desc) spc.searchablePlainTexts['items[' + i + '].description'] = it.desc;
      spc.links['items[' + i + '].sourceItem.url'] = it.url || '#';
      const o2 = { id: i + 1, description: it.desc || '', altText: it.alt || it.desc || '', sourceItem: { itemType: 2, fileExtension: '', progId: '' }, rawPreviewImageMinCanvasWidth: 32767, shouldOpenInNewTab: !!it.newTab };
      if (it.img) { o2.thumbnailType = 3; spc.imageSources['items[' + i + '].rawPreviewImageUrl'] = encodeURI(rel(it.img)); }
      else { o2.thumbnailType = 2; o2.fabricReactIcon = { iconName: it.icon || 'pagearrowright' }; }
      return o2;
    });
    const LAY = { filmstrip: 'FilmStrip', compact: 'List', /* 'Compact' da error de render al construirlo por JSON (probado con 3 variantes); se usa List */ list: 'List', button: 'Button', grid: 'Grid', tiles: 'Waffle', waffle: 'Waffle' };
    pr.layoutId = LAY[String(layout || 'compact').toLowerCase()] || layout;
    // el componente de diseño debe corresponder al layout (FilmStrip: 8ac0c53c; Grid/Button/Waffle/Compact: 706e33c8; List: sin dependencia)
    if (pr.layoutId === 'FilmStrip') spc.componentDependencies = { layoutComponentId: '8ac0c53c-e8d0-4e3e-87d0-7449eb0d4027' };
    else if (pr.layoutId === 'List') delete spc.componentDependencies;
    else spc.componentDependencies = { layoutComponentId: '706e33c8-af37-4e7b-9d22-6e5694d92a6f' };
    delete spc.customMetadata;
    pr.isMigrated = true;
    pr.hideWebPartWhenEmpty = true;
    pr.shouldShowThumbnail = true;
    if (o.imageWidth) pr.imageWidth = o.imageWidth;
    pr.listLayoutOptions = Object.assign({ showDescription: true, showIcon: true }, pr.listLayoutOptions, o.listOpts || {});
    pr.buttonLayoutOptions = Object.assign({}, pr.buttonLayoutOptions, o.buttonOpts || {});
    pr.waffleLayoutOptions = Object.assign({ iconSize: 1, onlyShowThumbnail: false }, pr.waffleLayoutOptions, o.waffleOpts || {});
    if (o.props) Object.assign(pr, o.props);
    return wp('quickLinks', p, d);
  };

  // names: nombres existentes en SPB.REC (cuentas reales de las plantillas); o,{layout:1|2, title}
  SPB.people = (names, p, o) => {
    o = o || {};
    const d = fromTpl('people'), spc = d.serverProcessedContent, pr = d.properties;
    const t = {}; const persons = [];
    names.forEach((n) => {
      const r = SPB.REC[n]; if (!r) { console.warn('persona sin cuenta: ' + n); return; }
      const i = persons.length; persons.push(clone(r.p)); t['persons[' + i + '].name'] = r.name; t['persons[' + i + '].email'] = r.email;
    });
    if (o.title) t.title = o.title;
    spc.searchablePlainTexts = t; pr.persons = persons; if (o.layout) pr.layout = o.layout;
    return wp('people', p, d);
  };

  SPB.listId = async (title) => (await SPB.api("web/lists/getbytitle('" + title + "')?$select=Id")).Id;
  SPB.events = (p, o) => {
    o = o || {};
    const d = fromTpl('events'), spc = d.serverProcessedContent, pr = d.properties;
    spc.searchablePlainTexts = o.title ? { title: o.title } : {};
    if (o.listId) pr.selectedListId = o.listId;
    if (o.layout) pr.layout = o.layout;
    if (o.title) pr.titleHTML = '<h2 class="headingSpacingAbove headingSpacingBelow">' + o.title + '</h2>';
    if (o.props) Object.assign(pr, o.props);
    return wp('events', p, d);
  };

  // Highlighted content. cfg: {kind:'carousel'|'cards', type:'pages'|'news'|'videos'|'documents'|'events', words:'Case', title:'More projects', max:6, sort:1}
  // contentTypes verificados: documents 1, pages 2, videos 3, events 4
  SPB.hc = (cfg, p) => {
    cfg = cfg || {};
    const key = cfg.kind === 'cards' ? 'hcCards' : 'hc';
    const d = fromTpl(key), pr = d.properties, q = pr.query;
    const types = { documents: 1, pages: 2, videos: 3, events: 4 }; // verificados por contenido renderizado; news/images sin verificar
    if (cfg.type) q.contentTypes = [types[cfg.type]];
    if (cfg.words !== undefined) q.filters = [{ filterType: 1, value: cfg.words }];
    if (cfg.max) pr.maxItemsPerPage = cfg.max;
    if (cfg.sort) q.sortType = cfg.sort;
    if (cfg.title !== undefined) d.serverProcessedContent.searchablePlainTexts = Object.assign({}, d.serverProcessedContent.searchablePlainTexts, { title: cfg.title });
    if (cfg.props) Object.assign(pr, cfg.props);
    return wp('hc', p, d);
  };
  SPB.news = (cfg, p) => {
    const d = fromTpl('news'); if (cfg && cfg.props) Object.assign(d.properties, cfg.props);
    return wp('news', p, d);
  };

  SPB.powerApp = (appId, height, p) => {
    const d = fromTpl('powerApp'); d.properties = Object.assign({}, d.properties, { powerAppId: appId });
    if (height) d.properties.height = height; return wp('powerApp', p, d);
  };
  SPB.embed = (url, height, p) => {
    const d = fromTpl('embed'); const pr = d.properties || {};
    if ('embedCode' in pr) pr.embedCode = '<iframe src="' + url + '" width="100%" height="' + (height || 600) + '" frameborder="0"></iframe>';
    if ('websiteUrl' in pr) pr.websiteUrl = url; if ('height' in pr) pr.height = height || 600;
    d.properties = pr; return wp('embed', p, d);
  };

  // ---------- imágenes de tu biblioteca de imágenes ----------
  SPB.IMG = SPB.IMG || {};
  SPB.assets = async (libTitle) => {
    libTitle = libTitle || CFG.assets || 'Assets';
    SPB.LIB = { title: libTitle, path: S + '/' + libTitle, listId: (await SPB.api("web/lists/getbytitle('" + libTitle + "')?$select=Id")).Id,
      siteId: (await SPB.api('site?$select=Id')).Id, webId: (await SPB.api('web?$select=Id')).Id };
    const f = await SPB.api("web/GetFolderByServerRelativeUrl('" + SPB.LIB.path + "')/Files?$select=Name,UniqueId&$top=500");
    await Promise.all(f.value.map((x) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { SPB.IMG[x.Name] = { uid: x.UniqueId, w: im.naturalWidth, h: im.naturalHeight }; res(); };
      im.onerror = () => { SPB.IMG[x.Name] = { uid: x.UniqueId, w: 0, h: 0 }; res(); };
      im.src = SPB.LIB.path + '/' + x.Name;
    })));
    return Object.keys(SPB.IMG).length;
  };
  SPB.imgUrl = (name) => SPB.LIB.path + '/' + name;
  SPB.img = (name, alt, link, p, o) => {
    const m = SPB.IMG[name]; if (!m) throw new Error('imagen no encontrada en la biblioteca: ' + name);
    return SPB.image(SPB.imgUrl(name), alt, link, p, Object.assign({ uniqueId: m.uid, width: m.w, height: m.h, siteId: SPB.LIB.siteId, webId: SPB.LIB.webId, listId: SPB.LIB.listId }, o || {}));
  };

  // ---------- páginas ----------
  SPB.createOrGetPage = async (fileName, title) => {
    const path = S + '/SitePages/' + fileName + '.aspx';
    try {
      const it = await SPB.api("web/GetFileByServerRelativeUrl('" + path + "')/ListItemAllFields?$select=Id");
      return it.Id;
    } catch (e) { /* no existe */ }
    const pg = await SPB.api('sitepages/pages', 'POST', { PageLayoutType: 'Article' });
    const id = pg.Id;
    await SPB.api('sitepages/pages(' + id + ')/SavePageAsDraft', 'POST', { Title: title || fileName, BannerImageUrl: '', CanvasContent1: '[]', LayoutWebpartsContent: '[]' });
    SPB.lastId = id;
    await SPB.api("web/lists/getbytitle('Site Pages')/items(" + id + ')/ValidateUpdateListItem', 'POST', { formValues: [{ FieldName: 'FileLeafRef', FieldValue: fileName }] });
    return id;
  };
  SPB.save = async (id, title, canvas) => {
    // cada guardado exige abrir sesión de edición (CheckoutPage); si hay bloqueo del editor (409/423) reintenta hasta ~2 min
    let err;
    for (let i = 0; i < 12; i++) {
      try {
        await SPB.digest();
        try { await SPB.api('sitepages/pages(' + id + ')/CheckoutPage', 'POST'); } catch (e) { err = e; }
        return await SPB.api('sitepages/pages(' + id + ')/SavePageAsDraft', 'POST', { Title: title, BannerImageUrl: '', CanvasContent1: JSON.stringify(canvas), LayoutWebpartsContent: '[]' });
      } catch (e) {
        err = e; if (!/409|423/.test(String(e))) throw e;
        await new Promise((r) => setTimeout(r, 10000));
      }
    }
    throw err;
  };
  SPB.readCanvas = async (fileName) => JSON.parse((await SPB.api("sitepages/pages/GetByUrl('SitePages/" + fileName + ".aspx')?$select=CanvasJson1")).CanvasJson1);
  SPB.version = '1.0';
})();
