import { execFileSync } from "node:child_process";

const KEY="9f4a7c2d1e8b63f0a5c9472d8b31e6fa";
const BASE="https://bimspecialist.github.io/Math/";
const KEY_LOCATION=BASE+KEY+".txt";

function changedPaths(){
  try{
    return execFileSync("git",["diff","--name-only","HEAD^","HEAD"],{encoding:"utf8"})
      .split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  }catch{
    return [];
  }
}
function urlForHtml(path){
  if(path==="index.html")return BASE;
  if(path.endsWith("/index.html"))return BASE+path.slice(0,-"index.html".length);
  return null;
}
const paths=changedPaths();
const urls=new Set();
for(const path of paths){
  const direct=urlForHtml(path);
  if(direct)urls.add(direct);
  if(path.startsWith("src/")||path.startsWith("styles/")||path==="robots.txt"||path==="sitemap.xml"||path==="llms.txt")urls.add(BASE);
}
if(!urls.size){
  console.log("IndexNow: no changed public URLs to submit.");
  process.exit(0);
}
const body={
  host:"bimspecialist.github.io",
  key:KEY,
  keyLocation:KEY_LOCATION,
  urlList:[...urls]
};
try{
  const response=await fetch("https://api.indexnow.org/indexnow",{
    method:"POST",
    headers:{"content-type":"application/json; charset=utf-8"},
    body:JSON.stringify(body)
  });
  if(!response.ok){
    console.error("IndexNow submission failed:",response.status,await response.text());
    process.exitCode=1;
  }else{
    console.log("IndexNow submitted",body.urlList.length,"URL(s).");
  }
}catch(error){
  console.error("IndexNow request failed:",error?.message??error);
  process.exitCode=1;
}
