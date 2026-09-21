/*
 * MEasyMate Money Project Notices V1
 * Normal production notice stays OFF.
 * System test notice appears only with ?test=1.
 */
(function(){
  "use strict";
  const TEST=new URLSearchParams(location.search).get("test")==="1";
  window.MEasyMateProjectNotices=[
    {
      id:"MONEY-TEMPLATE-001",
      scope:"money",
      type:"info",
      title:"MEasyMate Money",
      message:"ตัวอย่างประกาศเฉพาะโปรเจกต์ — ปิดใช้งานอยู่",
      start_at:null,
      end_at:null,
      priority:1,
      dismissible:true,
      enabled:false
    },
    {
      id:"MONEY-SYSTEM-TEST-F2112",
      scope:"money",
      type:"info",
      title:"🧪 Notice Test — PASS ถ้าคุณเห็นข้อความนี้",
      message:"ประกาศนี้แสดงเฉพาะ Test Mode (?test=1) และจะไม่แสดงให้ผู้ใช้ทั่วไป",
      start_at:null,
      end_at:null,
      priority:99,
      dismissible:false,
      test_only:true,
      enabled:TEST
    }
  ];
})();
