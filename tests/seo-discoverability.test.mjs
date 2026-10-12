import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,ROOT),"utf8");
const landingPages=[
  "scientific-calculator-online/index.html",
  "equation-solver/index.html",
  "engineering-calculator/index.html",
  "graphing-calculator/index.html",
  "unit-converter/index.html",
  "civil-engineering-formulas/index.html",
  "hydraulics-formulas/index.html",
  "research-calculator/index.html",
  "ar/scientific-calculator/index.html",
  "ar/equation-solver/index.html",
  "ar/engineering-calculator/index.html",
  "ar/civil-engineering-formulas/index.html",
  "ar/hydraulics-formulas/index.html"
];

test("homepage exposes strong crawlable SEO metadata and free SoftwareApplication schema",()=>{
  const html=read("index.html");
  assert.match(html,/<title>Scientific Calculator, Equation Solver & Engineering Math Tools \| Math Workspace<\/title>/);
  assert.match(html,/<meta name="description" content="[^"]{100,200}">/);
  assert.match(html,/<link rel="canonical" href="https:\/\/bimspecialist\.github\.io\/Math\/">/);
  assert.match(html,/"@type":"WebApplication"/);
  assert.match(html,/"offers":\{"@type":"Offer","price":"0","priceCurrency":"USD"\}/);
  for(const href of ["scientific-calculator-online/","equation-solver/","engineering-calculator/","graphing-calculator/","unit-converter/","civil-engineering-formulas/","hydraulics-formulas/","research-calculator/"]){
    assert.ok(html.includes('href="./'+href+'"'),"missing internal SEO link: "+href);
  }
  assert.doesNotMatch(html,/<meta\s+name="keywords"/i);
});

test("SEO landing pages have unique indexable metadata, canonical URLs, H1s and structured data",()=>{
  const titles=new Set(),descriptions=new Set(),canonicals=new Set();
  for(const path of landingPages){
    const html=read(path);
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1]??"";
    const description=html.match(/<meta name="description" content="([^"]+)">/)?.[1]??"";
    const canonical=html.match(/<link rel="canonical" href="([^"]+)">/)?.[1]??"";
    assert.ok(title.length>=25&&title.length<=90,"bad title length: "+path);
    assert.ok(description.length>=100&&description.length<=200,"bad description length: "+path);
    assert.match(canonical,/^https:\/\/bimspecialist\.github\.io\/Math\//);
    assert.match(html,/<h1>[^<]+<\/h1>/);
    assert.match(html,/<meta name="robots" content="index,follow/);
    assert.match(html,/"@type":"SoftwareApplication"/);
    assert.match(html,/"@type":"FAQPage"/);
    assert.match(html,/"price":"0"/);
    assert.doesNotMatch(html,/<meta\s+name="keywords"/i);
    assert.doesNotMatch(html,/Search topics covered|كلمات البحث التي تغطيها الصفحة/);
    assert.ok(!titles.has(title),"duplicate title: "+title);
    assert.ok(!descriptions.has(description),"duplicate description: "+description);
    assert.ok(!canonicals.has(canonical),"duplicate canonical: "+canonical);
    titles.add(title);descriptions.add(description);canonicals.add(canonical);
  }
});

test("English and Arabic priority landing pages declare hreflang alternates",()=>{
  for(const path of [
    "scientific-calculator-online/index.html","equation-solver/index.html","engineering-calculator/index.html",
    "civil-engineering-formulas/index.html","hydraulics-formulas/index.html",
    "ar/scientific-calculator/index.html","ar/equation-solver/index.html","ar/engineering-calculator/index.html",
    "ar/civil-engineering-formulas/index.html","ar/hydraulics-formulas/index.html"
  ]){
    const html=read(path);
    assert.match(html,/rel="alternate" hreflang="(?:en|ar)"/);
    assert.match(html,/rel="alternate" hreflang="x-default"/);
  }
});

test("sitemap lists homepage and every SEO landing page with current lastmod",()=>{
  const xml=read("sitemap.xml");
  assert.match(xml,/https:\/\/bimspecialist\.github\.io\/Math\/<\/loc>/);
  for(const path of landingPages){
    const url="https://bimspecialist.github.io/Math/"+path.replace(/index\.html$/,"");
    assert.ok(xml.includes("<loc>"+url+"</loc>"),"missing sitemap URL: "+url);
  }
  assert.match(xml,/<lastmod>2026-10-12<\/lastmod>/);
});

test("robots and AI discovery files allow search discovery without meta-keyword tricks",()=>{
  const robots=read("robots.txt"),llms=read("llms.txt");
  assert.match(robots,/User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(robots,/Sitemap: https:\/\/bimspecialist\.github\.io\/Math\/sitemap\.xml/);
  assert.match(llms,/Scientific Calculator Online:/);
  assert.match(llms,/حاسبة علمية أونلاين:/);
  assert.match(llms,/Accuracy and safety notes/);
});

test("IndexNow notification is best-effort and wired after Pages deployment",()=>{
  const workflow=read(".github/workflows/pages.yml");
  const script=read("scripts/submit-indexnow.mjs");
  assert.match(workflow,/Notify IndexNow about changed public URLs/);
  assert.match(workflow,/continue-on-error: true/);
  assert.match(workflow,/fetch-depth: 2/);
  assert.match(script,/https:\/\/api\.indexnow\.org\/indexnow/);
  assert.match(script,/git/);
});
