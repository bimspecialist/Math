export const FORMULA_CATEGORIES = Object.freeze([
  {id:"all",labelAr:"الكل",labelEn:"All"},
  {id:"algebra",labelAr:"الجبر",labelEn:"Algebra"},
  {id:"geometry",labelAr:"الهندسة",labelEn:"Geometry"},
  {id:"trigonometry",labelAr:"المثلثات",labelEn:"Trigonometry"},
  {id:"calculus",labelAr:"التفاضل والتكامل",labelEn:"Calculus"},
  {id:"statistics",labelAr:"الإحصاء والاحتمالات",labelEn:"Statistics"},
  {id:"sequences",labelAr:"المتتاليات",labelEn:"Sequences"},
  {id:"complex",labelAr:"الأعداد المركبة",labelEn:"Complex"},
  {id:"linear-algebra",labelAr:"الجبر الخطي",labelEn:"Linear Algebra"}
]);

const f=(id,category,titleAr,titleEn,formula,descriptionAr,tags=[])=>({id,category,titleAr,titleEn,formula,descriptionAr,tags});

export const FORMULAS = Object.freeze([
  f("quad","algebra","القانون العام للمعادلة التربيعية","Quadratic formula","x = (-b ± √(b²-4ac)) / 2a","لحل ax²+bx+c=0",["roots","polynomial"]),
  f("disc","algebra","المميّز","Discriminant","Δ = b² - 4ac","يحدد طبيعة جذور المعادلة التربيعية",["quadratic"]),
  f("diff-sq","algebra","فرق مربعين","Difference of squares","a² - b² = (a-b)(a+b)","تحليل فرق مربعين",["factor"]),
  f("sq-sum","algebra","مربع مجموع","Square of a sum","(a+b)² = a² + 2ab + b²","متطابقة جبرية",["identity"]),
  f("sq-diff","algebra","مربع فرق","Square of a difference","(a-b)² = a² - 2ab + b²","متطابقة جبرية",["identity"]),
  f("slope","algebra","ميل المستقيم","Slope","m = (y₂-y₁)/(x₂-x₁)","ميل خط بين نقطتين",["line"]),
  f("line","algebra","معادلة الميل والنقطة","Point-slope form","y-y₁ = m(x-x₁)","صيغة معادلة مستقيم",["line"]),
  f("percent","algebra","النسبة المئوية","Percentage","percentage = part / whole × 100%","حساب النسبة المئوية",["ratio"]),

  f("pyth","geometry","نظرية فيثاغورس","Pythagorean theorem","a² + b² = c²","للمثلث القائم",["triangle","right"]),
  f("tri-area","geometry","مساحة المثلث","Triangle area","A = ½bh","قاعدة × ارتفاع ÷ 2",["area"]),
  f("rect-area","geometry","مساحة المستطيل","Rectangle area","A = lw","الطول × العرض",["area"]),
  f("circle-area","geometry","مساحة الدائرة","Circle area","A = πr²","مساحة دائرة نصف قطرها r",["circle","area"]),
  f("circle-circ","geometry","محيط الدائرة","Circle circumference","C = 2πr","محيط دائرة",["circle"]),
  f("sphere-vol","geometry","حجم الكرة","Sphere volume","V = 4πr³/3","حجم كرة",["volume"]),
  f("sphere-area","geometry","مساحة سطح الكرة","Sphere surface area","A = 4πr²","مساحة سطح كرة",["surface"]),
  f("cyl-vol","geometry","حجم الأسطوانة","Cylinder volume","V = πr²h","حجم أسطوانة",["volume"]),
  f("cone-vol","geometry","حجم المخروط","Cone volume","V = πr²h/3","حجم مخروط",["volume"]),

  f("sin-def","trigonometry","تعريف الجيب","Sine ratio","sin θ = opposite / hypotenuse","في مثلث قائم",["sin"]),
  f("cos-def","trigonometry","تعريف جيب التمام","Cosine ratio","cos θ = adjacent / hypotenuse","في مثلث قائم",["cos"]),
  f("tan-def","trigonometry","تعريف الظل","Tangent ratio","tan θ = opposite / adjacent","في مثلث قائم",["tan"]),
  f("pyth-id","trigonometry","متطابقة فيثاغورس","Pythagorean identity","sin²θ + cos²θ = 1","متطابقة أساسية",["sin","cos"]),
  f("law-sines","trigonometry","قانون الجيوب","Law of sines","a/sin A = b/sin B = c/sin C","لأي مثلث",["triangle"]),
  f("law-cos","trigonometry","قانون جيب التمام","Law of cosines","c² = a²+b²-2ab cos C","لأي مثلث",["triangle"]),
  f("sin-double","trigonometry","ضعف الزاوية للجيب","Sine double angle","sin 2θ = 2 sinθ cosθ","متطابقة ضعف الزاوية",["identity"]),
  f("cos-double","trigonometry","ضعف الزاوية لجيب التمام","Cosine double angle","cos 2θ = cos²θ - sin²θ","متطابقة ضعف الزاوية",["identity"]),

  f("der-power","calculus","قاعدة القوة للمشتقة","Power rule","d(xⁿ)/dx = n xⁿ⁻¹","قاعدة أساسية للتفاضل",["derivative"]),
  f("der-product","calculus","قاعدة حاصل الضرب","Product rule","(fg)' = f'g + fg'","مشتقة حاصل ضرب",["derivative"]),
  f("der-quot","calculus","قاعدة القسمة","Quotient rule","(f/g)' = (f'g-fg')/g²","مشتقة حاصل قسمة",["derivative"]),
  f("der-chain","calculus","قاعدة السلسلة","Chain rule","d f(g(x))/dx = f'(g(x))g'(x)","للدوال المركبة",["derivative"]),
  f("int-power","calculus","تكامل القوة","Power integral","∫xⁿ dx = xⁿ⁺¹/(n+1)+C, n≠-1","قاعدة أساسية للتكامل",["integral"]),
  f("int-log","calculus","تكامل 1/x","Log integral","∫1/x dx = ln|x| + C","تكامل لوغاريتمي",["integral"]),
  f("ftc","calculus","المبرهنة الأساسية للتفاضل والتكامل","Fundamental theorem","∫ₐᵇ f(x)dx = F(b)-F(a)","حيث F' = f",["integral"]),

  f("mean","statistics","المتوسط الحسابي","Arithmetic mean","x̄ = Σxᵢ / n","متوسط القيم",["average"]),
  f("variance","statistics","التباين السكاني","Population variance","σ² = Σ(xᵢ-μ)² / N","قياس التشتت",["variance"]),
  f("std","statistics","الانحراف المعياري","Standard deviation","σ = √σ²","الجذر التربيعي للتباين",["deviation"]),
  f("zscore","statistics","الدرجة المعيارية","Z-score","z = (x-μ)/σ","توحيد القيم",["normal"]),
  f("comb","statistics","التوافيق","Combinations","nCr = n! / (r!(n-r)!)","اختيار دون اعتبار للترتيب",["probability"]),
  f("perm","statistics","التباديل","Permutations","nPr = n! / (n-r)!","اختيار مع اعتبار للترتيب",["probability"]),

  f("arith-n","sequences","الحد النوني لمتتالية حسابية","Arithmetic nth term","aₙ = a₁ + (n-1)d","متتالية حسابية",["sequence"]),
  f("arith-sum","sequences","مجموع متتالية حسابية","Arithmetic series sum","Sₙ = n(a₁+aₙ)/2","مجموع أول n حدود",["series"]),
  f("geo-n","sequences","الحد النوني لمتتالية هندسية","Geometric nth term","aₙ = a₁ rⁿ⁻¹","متتالية هندسية",["sequence"]),
  f("geo-sum","sequences","مجموع متتالية هندسية","Geometric series sum","Sₙ = a₁(1-rⁿ)/(1-r)","عندما r≠1",["series"]),
  f("geo-inf","sequences","مجموع هندسي لا نهائي","Infinite geometric sum","S∞ = a₁/(1-r), |r|<1","لسلسلة هندسية متقاربة",["series"]),

  f("complex-mod","complex","مقدار العدد المركب","Complex modulus","|a+bi| = √(a²+b²)","مقدار عدد مركب",["complex"]),
  f("complex-conj","complex","المرافق","Complex conjugate","z·z̄ = |z|²","خاصية المرافق",["complex"]),
  f("euler","complex","صيغة أويلر","Euler formula","eⁱθ = cosθ + i sinθ","ربط الأس المركب بالمثلثات",["complex"]),

  f("det2","linear-algebra","محدد 2×2","2×2 determinant","det([[a,b],[c,d]]) = ad-bc","محدد مصفوفة 2×2",["matrix"]),
  f("inv2","linear-algebra","معكوس 2×2","2×2 inverse","A⁻¹ = 1/(ad-bc) [[d,-b],[-c,a]]","إذا det(A)≠0",["matrix"]),
  f("dot","linear-algebra","الضرب النقطي","Dot product","a·b = Σ aᵢbᵢ","للشعاعات",["vector"]),
  f("matmul","linear-algebra","ضرب المصفوفات","Matrix multiplication","Cᵢⱼ = Σₖ AᵢₖBₖⱼ","قاعدة ضرب مصفوفتين",["matrix"])
]);

export function filterFormulas({category="all",query=""}={}){
  const q=String(query).trim().toLowerCase();
  return FORMULAS.filter(x=>{
    if(category!=="all"&&x.category!==category)return false;
    if(!q)return true;
    const hay=[x.titleAr,x.titleEn,x.formula,x.descriptionAr,...x.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
