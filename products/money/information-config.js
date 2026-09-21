(function(){
  "use strict";
  const config={
    projectId:"money",
    productName:"MEasyMate Money",
    appVersion:"F2.1.12",
    dataSchemaVersion:3,
    releaseChannel:"PRE-PROMO SYSTEM TEST",
    publicUrl:"https://app.measymate.com/money/",
    website:"https://measymate.com/",
    supportLine:"https://lin.ee/YlHM4br",
    storageMode:"Local-first • ข้อมูลการเงินหลักอยู่ในเครื่องผู้ใช้"
  };
  window.MEasyMateInformationConfig=config;
  if(window.MEasyMateInformation)window.MEasyMateInformation.init(config);
})();
