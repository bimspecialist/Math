export const PROFESSIONAL_LIBRARIES=Object.freeze([
  Object.freeze({
    id:"accounting",labelEn:"Accounting Library",labelAr:"مكتبة المحاسبة",descriptionEn:"Financial and management-accounting formulas for common business analysis.",descriptionAr:"قوانين محاسبية ومالية شائعة للتحليل المالي والإداري.",
    formulas:Object.freeze([
      pf("gross-profit","Gross Profit","مجمل الربح","GP = Revenue - COGS","مجمل الربح = الإيرادات - تكلفة البضاعة المباعة","Revenue - COGS",[
        v("Revenue","Revenue","الإيرادات"),v("COGS","COGS","تكلفة البضاعة المباعة")
      ]),
      pf("gross-margin","Gross Profit Margin","هامش مجمل الربح","GPM = (Revenue - COGS) / Revenue × 100","هامش مجمل الربح = (الإيرادات - تكلفة البضاعة المباعة) ÷ الإيرادات × 100","(Revenue - COGS) / Revenue * 100",[
        v("Revenue","Revenue","الإيرادات","",{exclusiveMin:0}),v("COGS","COGS","تكلفة البضاعة المباعة")
      ],"%"),
      pf("operating-margin","Operating Profit Margin","هامش الربح التشغيلي","OPM = OperatingIncome / Revenue × 100","هامش الربح التشغيلي = الربح التشغيلي ÷ الإيرادات × 100","OperatingIncome / Revenue * 100",[
        v("OperatingIncome","Operating income","الربح التشغيلي"),v("Revenue","Revenue","الإيرادات","",{exclusiveMin:0})
      ],"%"),
      pf("net-margin","Net Profit Margin","هامش صافي الربح","NPM = NetProfit / Revenue × 100","هامش صافي الربح = صافي الربح ÷ الإيرادات × 100","NetProfit / Revenue * 100",[
        v("NetProfit","Net profit","صافي الربح"),v("Revenue","Revenue","الإيرادات","",{exclusiveMin:0})
      ],"%"),
      pf("current-ratio","Current Ratio","نسبة التداول","CR = CurrentAssets / CurrentLiabilities","نسبة التداول = الأصول المتداولة ÷ الخصوم المتداولة","CurrentAssets / CurrentLiabilities",[
        v("CurrentAssets","Current assets","الأصول المتداولة"),v("CurrentLiabilities","Current liabilities","الخصوم المتداولة","",{exclusiveMin:0})
      ]),
      pf("working-capital","Working Capital","رأس المال العامل","WC = CurrentAssets - CurrentLiabilities","رأس المال العامل = الأصول المتداولة - الخصوم المتداولة","CurrentAssets - CurrentLiabilities",[
        v("CurrentAssets","Current assets","الأصول المتداولة"),v("CurrentLiabilities","Current liabilities","الخصوم المتداولة")
      ]),
      pf("quick-ratio","Quick Ratio","النسبة السريعة","QR = (Cash + Receivables + MarketableSecurities) / CurrentLiabilities","النسبة السريعة = (النقد + الذمم المدينة + الأوراق المالية القابلة للتداول) ÷ الخصوم المتداولة","(Cash + Receivables + MarketableSecurities) / CurrentLiabilities",[
        v("Cash","Cash","النقد"),v("Receivables","Receivables","الذمم المدينة"),v("MarketableSecurities","Marketable securities","أوراق مالية قابلة للتداول"),v("CurrentLiabilities","Current liabilities","الخصوم المتداولة","",{exclusiveMin:0})
      ]),
      pf("debt-equity","Debt-to-Equity Ratio","نسبة الدين إلى حقوق الملكية","D/E = TotalDebt / Equity","نسبة الدين إلى حقوق الملكية = إجمالي الدين ÷ حقوق الملكية","TotalDebt / Equity",[
        v("TotalDebt","Total debt","إجمالي الدين"),v("Equity","Equity","حقوق الملكية","",{nonZero:true})
      ]),
      pf("roa","Return on Assets","العائد على الأصول","ROA = NetIncome / AverageAssets × 100","العائد على الأصول = صافي الدخل ÷ متوسط الأصول × 100","NetIncome / AverageAssets * 100",[
        v("NetIncome","Net income","صافي الدخل"),v("AverageAssets","Average assets","متوسط الأصول","",{exclusiveMin:0})
      ],"%"),
      pf("asset-turnover","Asset Turnover","دوران الأصول","AT = Revenue / AverageAssets","دوران الأصول = الإيرادات ÷ متوسط الأصول","Revenue / AverageAssets",[
        v("Revenue","Revenue","الإيرادات"),v("AverageAssets","Average assets","متوسط الأصول","",{exclusiveMin:0})
      ]),
      pf("roe","Return on Equity","العائد على حقوق الملكية","ROE = NetIncome / AverageEquity × 100","العائد على حقوق الملكية = صافي الدخل ÷ متوسط حقوق الملكية × 100","NetIncome / AverageEquity * 100",[
        v("NetIncome","Net income","صافي الدخل"),v("AverageEquity","Average equity","متوسط حقوق الملكية","",{nonZero:true})
      ],"%"),
      pf("contribution-margin-unit","Contribution Margin per Unit","هامش المساهمة للوحدة","CM/unit = PricePerUnit - VariableCostPerUnit","هامش المساهمة للوحدة = سعر الوحدة - التكلفة المتغيرة للوحدة","PricePerUnit - VariableCostPerUnit",[
        v("PricePerUnit","Price per unit","سعر الوحدة"),v("VariableCostPerUnit","Variable cost per unit","التكلفة المتغيرة للوحدة")
      ]),
      pf("break-even","Break-even Units","نقطة التعادل بالوحدات","BE = FixedCosts / (PricePerUnit - VariableCostPerUnit)","نقطة التعادل = التكاليف الثابتة ÷ (سعر الوحدة - التكلفة المتغيرة للوحدة)","FixedCosts / (PricePerUnit - VariableCostPerUnit)",[
        v("FixedCosts","Fixed costs","التكاليف الثابتة","",{min:0}),v("PricePerUnit","Price per unit","سعر الوحدة"),v("VariableCostPerUnit","Variable cost per unit","التكلفة المتغيرة للوحدة")
      ]," units",[{kind:"gt",left:"PricePerUnit",right:"VariableCostPerUnit",code:"NONPOSITIVE_CONTRIBUTION_MARGIN"}]),
      pf("inventory-turnover","Inventory Turnover","دوران المخزون","IT = COGS / AverageInventory","دوران المخزون = تكلفة البضاعة المباعة ÷ متوسط المخزون","COGS / AverageInventory",[
        v("COGS","COGS","تكلفة البضاعة المباعة"),v("AverageInventory","Average inventory","متوسط المخزون","",{exclusiveMin:0})
      ])
    ])
  }),
  Object.freeze({
    id:"civil",labelEn:"Civil Engineering Library",labelAr:"مكتبة الهندسة المدنية",descriptionEn:"Practical metric formulas for quantities, slopes, structural actions, pressure, and reinforcement calculations.",descriptionAr:"قوانين مترية عملية للكميات والميول والأحمال والضغط وحسابات التسليح.",
    formulas:Object.freeze([
      pf("rect-area","Rectangle Area","مساحة المستطيل","A = L × W","المساحة = الطول × العرض","L * W",[v("L","Length (m)","الطول (م)"),v("W","Width (m)","العرض (م)")]," m²"),
      pf("concrete-volume","Concrete Volume","حجم الخرسانة","V = L × W × T","الحجم = الطول × العرض × السمك","L * W * T",[v("L","Length (m)","الطول (م)"),v("W","Width (m)","العرض (م)"),v("T","Thickness (m)","السمك (م)")]," m³"),
      pf("footing-volume","Footing Volume","حجم القاعدة","V = L × W × D","حجم القاعدة = الطول × العرض × العمق","L * W * D",[v("L","Length (m)","الطول (م)"),v("W","Width (m)","العرض (م)"),v("D","Depth (m)","العمق (م)")]," m³"),
      pf("slope-percent","Slope Percent","نسبة الميل","Slope = Rise / Run × 100","نسبة الميل = الارتفاع ÷ الامتداد × 100","Rise / Run * 100",[v("Rise","Rise","الارتفاع"),v("Run","Horizontal run","الامتداد الأفقي")],"%"),
      pf("bearing-pressure","Average Bearing Pressure","متوسط ضغط التحمل","q = P / A","ضغط التحمل = الحمل ÷ المساحة","P / A",[v("P","Load (kN)","الحمل (كيلونيوتن)"),v("A","Area (m²)","المساحة (م²)")]," kPa"),
      pf("udl-moment","Simply Supported Beam — UDL Max Moment","أقصى عزم لكمرة بسيطة تحت حمل موزع","Mmax = wL² / 8","أقصى عزم = الحمل الموزع × مربع البحر ÷ 8","w * L^2 / 8",[v("w","UDL (kN/m)","الحمل الموزع (كيلونيوتن/م)"),v("L","Span (m)","البحر (م)")]," kN·m"),
      pf("center-load-moment","Simply Supported Beam — Center Load Max Moment","أقصى عزم لكمرة بسيطة تحت حمل مركزي","Mmax = PL / 4","أقصى عزم = الحمل المركزي × البحر ÷ 4","P * L / 4",[v("P","Point load (kN)","الحمل المركز (كيلونيوتن)"),v("L","Span (m)","البحر (م)")]," kN·m"),
      pf("rebar-unit-weight","Rebar Unit Weight","وزن المتر الطولي لحديد التسليح","w = ρπd² / 4","وزن المتر = الكثافة × π × مربع القطر ÷ 4","7850 * pi * (d / 1000)^2 / 4",[v("d","Bar diameter (mm)","قطر السيخ (مم)")]," kg/m"),
      pf("rebar-total-weight","Total Rebar Weight","الوزن الإجمالي لحديد التسليح","W = UnitWeight × Length × Quantity","الوزن الإجمالي = وزن المتر × الطول × العدد","UnitWeight * Length * Quantity",[v("UnitWeight","Unit weight (kg/m)","وزن المتر (كجم/م)"),v("Length","Bar length (m)","طول السيخ (م)"),v("Quantity","Quantity","العدد")]," kg")
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

function v(id,labelEn,labelAr,defaultValue="",constraints={}){return Object.freeze({id,labelEn,labelAr,defaultValue,...constraints})}
function pf(id,titleEn,titleAr,formulaEn,formulaAr,calcExpression,variables,unit="",rules=[]){
  return Object.freeze({id,titleEn,titleAr,formulaEn,formulaAr,calcExpression,variables:Object.freeze(variables),unit,rules:Object.freeze(rules)});
}

export function getProfessionalLibrary(id){return PROFESSIONAL_LIBRARIES.find(x=>x.id===id)??null}
export function getProfessionalFormula(libraryId,formulaId){return getProfessionalLibrary(libraryId)?.formulas.find(x=>x.id===formulaId)??null}
