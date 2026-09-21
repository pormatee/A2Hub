/*
 * MEEasyMate Money System Test Mode V1
 * Enabled ONLY with ?test=1. Never reads financial values.
 */
(function(){
  "use strict";
  const TEST=new URLSearchParams(location.search).get("test")==="1";
  if(!TEST)return;

  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function pass(v){return v?'<b style="color:#0d9275">PASS</b>':'<b style="color:#c75844">FAIL</b>'}
  function info(){try{return window.MEasyMateInformation?.status?.()||{}}catch(_){return {}}}
  function ast(){try{return window.MEasyMateAnalytics?.status?.()||{}}catch(_){return {}}}
  function sum(){try{return window.MEasyMateAnalytics?.getLocalSummary?.()||{}}catch(_){return {}}}
  function ins(){try{return window.MEasyMateUsageInsights?.current?.()||{}}catch(_){return {}}}
  function notice(){return !!document.querySelector("#measymate-notify-container .mm-notice")}

  function render(){
    const i=info(),a=ast(),s=sum(),u=ins();
    const host=document.getElementById("mmSystemTestBody");
    if(!host)return;
    const top=(u.top_events||[]).map(x=>`${esc(x.event)} ${x.count}`).join(" • ")||"ยังไม่มี";
    host.innerHTML=`
      <div style="display:grid;gap:7px">
        <div>Information ${pass(i.initialized&&i.project_id==="money"&&i.app_version==="F2.1.12")}</div>
        <div>Notice ${pass(!!window.MEasyMateNotify&&notice())} <span style="color:#708397">เห็นประกาศทดสอบด้านบน = ผ่าน</span></div>
        <div>Analytics Local ${pass(a.initialized&&a.local_stats_enabled===true)}</div>
        <div>Usage Insights ${pass(!!window.MEasyMateUsageInsights)}</div>
        <div>Central Analytics <b style="color:#1475b6">${a.transport_enabled?"ON":"SAFE OFF"}</b> <span style="color:#708397">(ยังไม่มี endpoint กลาง)</span></div>
        <hr style="border:0;border-top:1px solid #dfeaf1;width:100%">
        <div><b>เหตุการณ์ในเครื่อง:</b> ${Number(s.total_events||0)}</div>
        <div><b>วันที่ใช้งาน:</b> ${Number(u.active_days||0)}</div>
        <div><b>การเปลี่ยนหน้า:</b> ${Number(u.navigation_events||0)} • <b>การใช้ฟีเจอร์:</b> ${Number(u.action_events||0)}</div>
        <div><b>Runtime error:</b> ${Number(u.runtime_errors||0)}</div>
        <div><b>Top events:</b> <span style="color:#708397">${top}</span></div>
        <div><b>ภาพรวม:</b> ${esc(u.health||"")}</div>
      </div>`;
  }

  function create(){
    const wrap=document.createElement("div");
    wrap.id="measymate-system-test";
    wrap.style.cssText="position:fixed;left:10px;right:10px;bottom:82px;z-index:10050;max-width:560px;margin:auto;background:#fff;border:2px solid #1689f5;border-radius:18px;box-shadow:0 14px 40px rgba(25,50,71,.22);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#193247";
    wrap.innerHTML=`
      <div style="padding:11px 12px;display:flex;justify-content:space-between;align-items:center;background:#edf7ff;border-radius:16px 16px 0 0">
        <b>🧪 System Test F2.1.12</b>
        <button id="mmTestToggle" style="border:0;background:#fff;border-radius:9px;padding:5px 8px;font-weight:800">ย่อ</button>
      </div>
      <div id="mmTestPanel" style="padding:12px;font-size:12px;line-height:1.55">
        <div id="mmSystemTestBody"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px">
          <button id="mmTestEvent" style="border:0;border-radius:12px;padding:10px;background:#1689f5;color:#fff;font-weight:800">สร้าง Event ทดสอบ</button>
          <button id="mmTestRefresh" style="border:1px solid #dfeaf1;border-radius:12px;padding:10px;background:#fff;font-weight:800">ตรวจใหม่</button>
        </div>
        <div style="font-size:10px;color:#708397;margin-top:8px">Test Mode ไม่อ่านยอดเงิน รายการธุรกรรม ข้อความ หรือรูปภาพ</div>
      </div>`;
    document.body.appendChild(wrap);

    document.getElementById("mmTestToggle").onclick=()=>{
      const p=document.getElementById("mmTestPanel");
      const hidden=p.style.display==="none";
      p.style.display=hidden?"block":"none";
      document.getElementById("mmTestToggle").textContent=hidden?"ย่อ":"เปิด";
    };
    document.getElementById("mmTestRefresh").onclick=render;
    document.getElementById("mmTestEvent").onclick=()=>{
      try{window.MEasyMateAnalytics?.track?.("system_test",{kind:"manual"})}catch(_){}
      setTimeout(render,80);
    };
    render();
  }

  function boot(){
    setTimeout(()=>{
      try{window.MEasyMateNotify?.render?.()}catch(_){}
      create();
    },180);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
