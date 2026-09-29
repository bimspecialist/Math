export const PROFESSIONAL_LIBRARIES=Object.freeze([
  Object.freeze({
    id:"accounting",labelEn:"Accounting Library",labelAr:"مكتبة المحاسبة",descriptionEn:"Financial and management-accounting formulas for common business analysis.",descriptionAr:"قوانين محاسبية ومالية شائعة للتحليل المالي والإداري.",
    formulas:Object.freeze([
      pf("gross-profit","Gross Profit","مجمل الربح","GP = Revenue - COGS","مجمل الربح = الإيرادات - تكلفة البضاعة المباعة","Revenue - COGS",[
        v("Revenue","Revenue","الإيرادات"),v("COGS","COGS","تكلفة البضاعة المباعة")
      ]),
      pf("net-margin","Net Profit Margin","هامش صافي الربح","NPM = NetProfit / Revenue × 100","هامش صافي الربح = صافي الربح ÷ الإيرادات × 100","NetProfit / Revenue * 100",[
        v("NetProfit","Net profit","صافي الربح"),v("Revenue","Revenue","الإيرادات")
      ],"%"),
      pf("current-ratio","Current Ratio","نسبة التداول","CR = CurrentAssets / CurrentLiabilities","نسبة التداول = الأصول المتداولة ÷ الخصوم المتداولة","CurrentAssets / CurrentLiabilities",[
        v("CurrentAssets","Current assets","الأصول المتداولة"),v("CurrentLiabilities","Current liabilities","الخصوم المتداولة")
      ]),
      pf("quick-ratio","Quick Ratio","النسبة السريعة","QR = (Cash + Receivables + MarketableSecurities) / CurrentLiabilities","النسبة السريعة = (النقد + الذمم المدينة + الأوراق المالية القابلة للتداول) ÷ الخصوم المتداولة","(Cash + Receivables + MarketableSecurities) / CurrentLiabilities",[
        v("Cash","Cash","النقد"),v("Receivables","Receivables","الذمم المدينة"),v("MarketableSecurities","Marketable securities","أوراق مالية قابلة للتداول"),v("CurrentLiabilities","Current liabilities","الخصوم المتداولة")
      ]),
      pf("debt-equity","Debt-to-Equity Ratio","نسبة الدين إلى حقوق الملكية","D/E = TotalDebt / Equity","نسبة الدين إلى حقوق الملكية = إجمالي الدين ÷ حقوق الملكية","TotalDebt / Equity",[
        v("TotalDebt","Total debt","إجمالي الدين"),v("Equity","Equity","حقوق الملكية")
      ]),
      pf("roa","Return on Assets","العائد على الأصول","ROA = NetIncome / AverageAssets × 100","العائد على الأصول = صافي الدخل ÷ متوسط الأصول × 100","NetIncome / AverageAssets * 100",[
        v("NetIncome","Net income","صافي الدخل"),v("AverageAssets","Average assets","متوسط الأصول")
      ],"%"),
      pf("roe","Return on Equity","العائد على حقوق الملكية","ROE = NetIncome / AverageEquity × 100","العائد على حقوق الملكية = صافي الدخل ÷ متوسط حقوق الملكية × 100","NetIncome / AverageEquity * 100",[
        v("NetIncome","Net income","صافي الدخل"),v("AverageEquity","Average equity","متوسط حقوق الملكية")
      ],"%"),
      pf("break-even","Break-even Units","نقطة التعادل بالوحدات","BE = FixedCosts / (PricePerUnit - VariableCostPerUnit)","نقطة التعادل = التكاليف الثابتة ÷ (سعر الوحدة - التكلفة المتغيرة للوحدة)","FixedCosts / (PricePerUnit - VariableCostPerUnit)",[
        v("FixedCosts","Fixed costs","التكاليف الثابتة"),v("PricePerUnit","Price per unit","سعر الوحدة"),v("VariableCostPerUnit","Variable cost per unit","التكلفة المتغيرة للوحدة")
      ]," units"),
      pf("inventory-turnover","Inventory Turnover","دوران المخزون","IT = COGS / AverageInventory","دوران المخزون = تكلفة البضاعة المباعة ÷ متوسط المخزون","COGS / AverageInventory",[
        v("COGS","COGS","تكلفة البضاعة المباعة"),v("AverageInventory","Average inventory","متوسط المخزون")
      ])
    ])
  }),
  Object.freeze({
    id:"engineering",labelEn:"Engineering Library",labelAr:"مكتبة المهندسين",descriptionEn:"Core formulas for mechanics, fluids, electricity, and general engineering calculations.",descriptionAr:"قوانين أساسية للميكانيكا والموائع والكهرباء والحسابات الهندسية العامة.",
    formulas:Object.freeze([
      pf("stress","Normal Stress","الإجهاد العادي","σ = F / A","الإجهاد = القوة ÷ المساحة","F / A",[v("F","Force","القوة"),v("A","Area","المساحة")]," Pa"),
      pf("strain","Normal Strain","الانفعال العادي","ε = ΔL / L","الانفعال = التغير في الطول ÷ الطول الأصلي","DeltaL / L",[v("DeltaL","Change in length","التغير في الطول"),v("L","Original length","الطول الأصلي")]),
      pf("ohm","Ohm's Law","قانون أوم","V = I × R","الجهد = التيار × المقاومة","I * R",[v("I","Current","التيار"),v("R","Resistance","المقاومة")]," V"),
      pf("electric-power","Electrical Power","القدرة الكهربائية","P = V × I","القدرة = الجهد × التيار","V * I",[v("V","Voltage","الجهد"),v("I","Current","التيار")]," W"),
      pf("density","Density","الكثافة","ρ = m / V","الكثافة = الكتلة ÷ الحجم","m / V",[v("m","Mass","الكتلة"),v("V","Volume","الحجم")]),
      pf("velocity","Average Velocity","السرعة المتوسطة","v = Δx / Δt","السرعة المتوسطة = الإزاحة ÷ الزمن","DeltaX / DeltaT",[v("DeltaX","Displacement","الإزاحة"),v("DeltaT","Time interval","الفترة الزمنية")]),
      pf("acceleration","Average Acceleration","التسارع المتوسط","a = Δv / Δt","التسارع المتوسط = التغير في السرعة ÷ الزمن","DeltaV / DeltaT",[v("DeltaV","Velocity change","التغير في السرعة"),v("DeltaT","Time interval","الفترة الزمنية")]),
      pf("hydrostatic","Hydrostatic Pressure","الضغط الهيدروستاتيكي","p = ρgh","الضغط = الكثافة × تسارع الجاذبية × العمق","rho * g * h",[v("rho","Fluid density","كثافة المائع"),v("g","Gravity acceleration","تسارع الجاذبية","9.80665"),v("h","Depth","العمق")]," Pa"),
      pf("flow","Volumetric Flow Rate","معدل التدفق الحجمي","Q = A × v","معدل التدفق = المساحة × السرعة","A * v",[v("A","Flow area","مساحة المقطع"),v("v","Mean velocity","السرعة المتوسطة")])
    ])
  }),
  Object.freeze({
    id:"pmp",labelEn:"PMP / Earned Value Library",labelAr:"مكتبة PMP والقيمة المكتسبة",descriptionEn:"Common earned-value and PERT formulas used in project-management practice.",descriptionAr:"قوانين شائعة للقيمة المكتسبة وPERT في إدارة المشاريع.",
    formulas:Object.freeze([
      pf("cpi","Cost Performance Index (CPI)","مؤشر أداء التكلفة CPI","CPI = EV / AC","مؤشر أداء التكلفة = القيمة المكتسبة ÷ التكلفة الفعلية","EV / AC",[v("EV","Earned value (EV)","القيمة المكتسبة EV"),v("AC","Actual cost (AC)","التكلفة الفعلية AC")]),
      pf("spi","Schedule Performance Index (SPI)","مؤشر أداء الجدول SPI","SPI = EV / PV","مؤشر أداء الجدول = القيمة المكتسبة ÷ القيمة المخططة","EV / PV",[v("EV","Earned value (EV)","القيمة المكتسبة EV"),v("PV","Planned value (PV)","القيمة المخططة PV")]),
      pf("cv","Cost Variance (CV)","تباين التكلفة CV","CV = EV - AC","تباين التكلفة = القيمة المكتسبة - التكلفة الفعلية","EV - AC",[v("EV","Earned value (EV)","القيمة المكتسبة EV"),v("AC","Actual cost (AC)","التكلفة الفعلية AC")]),
      pf("sv","Schedule Variance (SV)","تباين الجدول SV","SV = EV - PV","تباين الجدول = القيمة المكتسبة - القيمة المخططة","EV - PV",[v("EV","Earned value (EV)","القيمة المكتسبة EV"),v("PV","Planned value (PV)","القيمة المخططة PV")]),
      pf("eac-cpi","Estimate at Completion (CPI trend)","التقدير عند الإكمال باتجاه CPI","EAC = BAC / CPI","التقدير عند الإكمال = الميزانية عند الإكمال ÷ مؤشر أداء التكلفة","BAC / CPI",[v("BAC","Budget at completion (BAC)","الميزانية عند الإكمال BAC"),v("CPI","Cost performance index","مؤشر أداء التكلفة")]),
      pf("eac-remaining","Estimate at Completion (remaining work)","التقدير عند الإكمال للعمل المتبقي","EAC = AC + (BAC - EV)","التقدير عند الإكمال = التكلفة الفعلية + (الميزانية عند الإكمال - القيمة المكتسبة)","AC + (BAC - EV)",[v("AC","Actual cost (AC)","التكلفة الفعلية AC"),v("BAC","Budget at completion (BAC)","الميزانية عند الإكمال BAC"),v("EV","Earned value (EV)","القيمة المكتسبة EV")]),
      pf("vac","Variance at Completion (VAC)","التباين عند الإكمال VAC","VAC = BAC - EAC","التباين عند الإكمال = الميزانية عند الإكمال - التقدير عند الإكمال","BAC - EAC",[v("BAC","Budget at completion (BAC)","الميزانية عند الإكمال BAC"),v("EAC","Estimate at completion (EAC)","التقدير عند الإكمال EAC")]),
      pf("tcpi","To-Complete Performance Index","مؤشر الأداء لإكمال العمل TCPI","TCPI = (BAC - EV) / (BAC - AC)","مؤشر الأداء لإكمال العمل = (BAC - EV) ÷ (BAC - AC)","(BAC - EV) / (BAC - AC)",[v("BAC","Budget at completion (BAC)","الميزانية عند الإكمال BAC"),v("EV","Earned value (EV)","القيمة المكتسبة EV"),v("AC","Actual cost (AC)","التكلفة الفعلية AC")]),
      pf("pert","PERT Expected Duration","المدة المتوقعة بطريقة PERT","TE = (O + 4M + P) / 6","المدة المتوقعة = (المتفائل + 4×الأرجح + المتشائم) ÷ 6","(O + 4 * M + P) / 6",[v("O","Optimistic duration","المدة المتفائلة"),v("M","Most likely duration","المدة الأرجح"),v("P","Pessimistic duration","المدة المتشائمة")])
    ])
  })
]);

function v(id,labelEn,labelAr,defaultValue=""){return Object.freeze({id,labelEn,labelAr,defaultValue})}
function pf(id,titleEn,titleAr,formulaEn,formulaAr,calcExpression,variables,unit=""){
  return Object.freeze({id,titleEn,titleAr,formulaEn,formulaAr,calcExpression,variables:Object.freeze(variables),unit});
}

export function getProfessionalLibrary(id){return PROFESSIONAL_LIBRARIES.find(x=>x.id===id)??null}
export function getProfessionalFormula(libraryId,formulaId){return getProfessionalLibrary(libraryId)?.formulas.find(x=>x.id===formulaId)??null}
