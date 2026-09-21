/*
 * MEasyMate Analytics Core V1
 * Anonymous local usage counters. Central transport is optional and fail-closed.
 */
(function(global){
  "use strict";
  const LOCAL_KEY="MEasyMateAnalyticsLocalV1";
  const INSTALL_KEY="MEasyMateAnalyticsInstallV1";
  const SESSION_KEY="MEasyMateAnalyticsSessionV1";
  let memoryLocal={};
  let memoryInstall="";
  let memorySession="";
  let cfg={
    projectId:"",
    appVersion:"",
    dataSchemaVersion:null,
    localStatsEnabled:true,
    transportEnabled:false,
    endpoint:"",
    includeInstallId:true,
    retentionDays:90,
    allowEvents:[],
    allowMetaKeys:["view","action","result","kind"]
  };

  function parse(v,f){try{return JSON.parse(v)}catch(_){return f}}
  function randomId(prefix){
    try{if(global.crypto&&crypto.randomUUID)return prefix+crypto.randomUUID()}catch(_){}
    return prefix+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,12);
  }
  function installId(){
    try{let v=localStorage.getItem(INSTALL_KEY);if(!v){v=randomId("i_");localStorage.setItem(INSTALL_KEY,v)}return v}
    catch(_){if(!memoryInstall)memoryInstall=randomId("i_mem_");return memoryInstall}
  }
  function sessionId(){
    try{let v=sessionStorage.getItem(SESSION_KEY);if(!v){v=randomId("s_");sessionStorage.setItem(SESSION_KEY,v)}return v}
    catch(_){if(!memorySession)memorySession=randomId("s_mem_");return memorySession}
  }
  function dayKey(d){return d.toISOString().slice(0,10)}
  function deviceClass(){
    const ua=navigator.userAgent||"";
    if(/iPad|Tablet|Android(?!.*Mobile)/i.test(ua))return "tablet";
    if(/Mobi|Android|iPhone/i.test(ua))return "mobile";
    return "desktop";
  }
  function browserFamily(){
    const ua=navigator.userAgent||"";
    if(/Edg\//.test(ua))return "edge";
    if(/OPR\//.test(ua))return "opera";
    if(/SamsungBrowser\//.test(ua))return "samsung";
    if(/CriOS|Chrome\//.test(ua))return "chrome";
    if(/FxiOS|Firefox\//.test(ua))return "firefox";
    if(/Safari\//.test(ua)&&!/Chrome|Chromium|Android/.test(ua))return "safari";
    return "other";
  }
  function osFamily(){
    const ua=navigator.userAgent||"";
    if(/Android/i.test(ua))return "android";
    if(/iPhone|iPad|iPod/i.test(ua))return "ios";
    if(/Windows/i.test(ua))return "windows";
    if(/Mac OS X|Macintosh/i.test(ua))return "macos";
    if(/Linux/i.test(ua))return "linux";
    return "other";
  }
  function cleanMeta(meta){
    const out={}; if(!meta||typeof meta!=="object")return out;
    const allowed=new Set(cfg.allowMetaKeys||[]);
    for(const [k,v] of Object.entries(meta)){
      if(!allowed.has(k)||v===null||v===undefined)continue;
      const s=String(v).toLowerCase().replace(/[^a-z0-9_-]/g,"_").slice(0,40);
      if(s)out[k]=s;
    }
    return out;
  }
  function loadLocal(){
    try{return parse(localStorage.getItem(LOCAL_KEY),{})||{}}
    catch(_){return Object.assign({},memoryLocal,{event_counts:Object.assign({},memoryLocal.event_counts||{}),active_days:Array.isArray(memoryLocal.active_days)?memoryLocal.active_days.slice():[]})}
  }
  function saveLocal(v){
    memoryLocal=JSON.parse(JSON.stringify(v||{}));
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(v))}catch(_){}
  }
  function updateLocal(event,now){
    if(!cfg.localStatsEnabled)return;
    const s=loadLocal();
    s.project_id=cfg.projectId;
    s.app_version=cfg.appVersion;
    s.first_seen=s.first_seen||now.toISOString();
    s.last_seen=now.toISOString();
    s.total_events=Number(s.total_events||0)+1;
    s.event_counts=s.event_counts||{};
    s.event_counts[event]=Number(s.event_counts[event]||0)+1;
    const today=dayKey(now);
    let days=Array.isArray(s.active_days)?s.active_days:[];
    if(!days.includes(today))days.push(today);
    s.active_days=days.slice(-Math.max(7,Number(cfg.retentionDays||90)));
    saveLocal(s);
  }
  function payload(event,meta,now){
    const p={
      event,
      project_id:cfg.projectId,
      app_version:cfg.appVersion,
      data_schema_version:cfg.dataSchemaVersion,
      occurred_at:now.toISOString(),
      session_id:sessionId(),
      device_class:deviceClass(),
      browser_family:browserFamily(),
      os_family:osFamily(),
      meta:cleanMeta(meta)
    };
    if(cfg.includeInstallId)p.install_id=installId();
    return p;
  }
  function send(p){
    if(!cfg.transportEnabled||!cfg.endpoint)return false;
    try{
      const body=JSON.stringify(p);
      if(navigator.sendBeacon&&navigator.sendBeacon(cfg.endpoint,new Blob([body],{type:"application/json"})))return true;
      fetch(cfg.endpoint,{method:"POST",headers:{"content-type":"application/json"},body,keepalive:true,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer"}).catch(()=>{});
      return true;
    }catch(_){return false}
  }
  function init(config){
    cfg=Object.assign({},cfg,config||{});
    cfg.allowEvents=Array.isArray(cfg.allowEvents)?cfg.allowEvents:[];
    cfg.allowMetaKeys=Array.isArray(cfg.allowMetaKeys)?cfg.allowMetaKeys:["view","action","result","kind"];
    global.MEasyMateAnalyticsConfig=Object.assign({},cfg);
    return true;
  }
  function track(event,meta){
    try{
      if(!event||!cfg.allowEvents.includes(event))return false;
      const now=new Date();
      updateLocal(event,now);
      send(payload(event,meta,now));
      return true;
    }catch(_){return false}
  }
  function getLocalSummary(){
    const s=loadLocal();
    return {
      project_id:s.project_id||cfg.projectId,
      app_version:s.app_version||cfg.appVersion,
      total_events:Number(s.total_events||0),
      event_counts:Object.assign({},s.event_counts||{}),
      active_days:Array.isArray(s.active_days)?s.active_days.slice():[],
      first_seen:s.first_seen||null,
      last_seen:s.last_seen||null,
      transport_enabled:!!(cfg.transportEnabled&&cfg.endpoint)
    };
  }
  function status(){
    return {
      initialized:!!cfg.projectId,
      project_id:cfg.projectId,
      app_version:cfg.appVersion,
      local_stats_enabled:!!cfg.localStatsEnabled,
      transport_enabled:!!(cfg.transportEnabled&&cfg.endpoint),
      endpoint_configured:!!cfg.endpoint,
      allowed_event_count:(cfg.allowEvents||[]).length
    };
  }
  global.MEasyMateAnalytics={init,track,getLocalSummary,status};
})(window);
