/*
 * MEasyMate Information Core V1
 * Product metadata only. Never reads financial/user content.
 */
(function(global){
  "use strict";
  let cfg=null;

  function init(config){
    cfg=Object.assign({},config||{});
    global.MEasyMateInformationConfig=Object.assign({},cfg);
    renderAll();
    return !!cfg.projectId;
  }

  function status(){
    return {
      initialized:!!(cfg&&cfg.projectId),
      project_id:cfg?.projectId||"",
      product_name:cfg?.productName||"",
      app_version:cfg?.appVersion||"",
      data_schema_version:cfg?.dataSchemaVersion??null,
      release_channel:cfg?.releaseChannel||"",
      public_url:cfg?.publicUrl||"",
      support_line:cfg?.supportLine||"",
      website:cfg?.website||"",
      storage_mode:cfg?.storageMode||""
    };
  }

  function renderOne(host){
    if(!host||!cfg)return;
    host.textContent="";
    const box=document.createElement("div");
    box.style.cssText="font-size:11px;line-height:1.65;color:#708397";
    [
      ["ผลิตภัณฑ์",cfg.productName],
      ["เวอร์ชัน",cfg.appVersion],
      ["รูปแบบข้อมูล",cfg.dataSchemaVersion],
      ["สถานะ",cfg.releaseChannel],
      ["การเก็บข้อมูล",cfg.storageMode]
    ].forEach(([k,v])=>{
      if(v===undefined||v===null||v==="")return;
      const row=document.createElement("div");
      const b=document.createElement("b");
      b.style.color="#193247";
      b.textContent=k+": ";
      row.appendChild(b);
      row.appendChild(document.createTextNode(String(v)));
      box.appendChild(row);
    });
    host.appendChild(box);
  }

  function renderAll(){
    try{document.querySelectorAll("[data-measymate-information]").forEach(renderOne)}catch(_){}
  }

  global.MEasyMateInformation=Object.freeze({init,status,renderAll});
})(window);
