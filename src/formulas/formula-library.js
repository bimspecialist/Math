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

const RAW_FORMULAS = [
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
];

const EN_DESCRIPTIONS = Object.freeze({
  quad:"Solves ax² + bx + c = 0.",
  disc:"Determines the nature of quadratic roots.",
  "diff-sq":"Factors a difference of two squares.",
  "sq-sum":"Algebraic identity for the square of a sum.",
  "sq-diff":"Algebraic identity for the square of a difference.",
  slope:"Slope of a line through two points.",
  line:"Point-slope form of a straight line.",
  percent:"Calculates a percentage from a part and a whole.",
  pyth:"Relationship between side lengths in a right triangle.",
  "tri-area":"Area from a base and perpendicular height.",
  "rect-area":"Area of a rectangle.",
  "circle-area":"Area of a circle of radius r.",
  "circle-circ":"Circumference of a circle.",
  "sphere-vol":"Volume of a sphere.",
  "sphere-area":"Surface area of a sphere.",
  "cyl-vol":"Volume of a cylinder.",
  "cone-vol":"Volume of a cone.",
  "sin-def":"Sine ratio in a right triangle.",
  "cos-def":"Cosine ratio in a right triangle.",
  "tan-def":"Tangent ratio in a right triangle.",
  "pyth-id":"Fundamental trigonometric identity.",
  "law-sines":"Relates sides and opposite angles in any triangle.",
  "law-cos":"Relates three sides and one angle in any triangle.",
  "sin-double":"Double-angle identity for sine.",
  "cos-double":"Double-angle identity for cosine.",
  "der-power":"Basic differentiation rule for powers.",
  "der-product":"Derivative of a product of two functions.",
  "der-quot":"Derivative of a quotient of two functions.",
  "der-chain":"Derivative rule for composite functions.",
  "int-power":"Basic antiderivative rule for powers.",
  "int-log":"Antiderivative of 1/x.",
  ftc:"Connects definite integration with antiderivatives.",
  mean:"Arithmetic average of a data set.",
  variance:"Population measure of spread around the mean.",
  std:"Square root of the population variance.",
  zscore:"Standardizes a value relative to mean and standard deviation.",
  comb:"Number of selections when order does not matter.",
  perm:"Number of selections when order matters.",
  "arith-n":"Nth term of an arithmetic sequence.",
  "arith-sum":"Sum of the first n terms of an arithmetic sequence.",
  "geo-n":"Nth term of a geometric sequence.",
  "geo-sum":"Sum of the first n terms of a geometric sequence.",
  "geo-inf":"Sum of a convergent infinite geometric series.",
  "complex-mod":"Magnitude of a complex number.",
  "complex-conj":"Property relating a complex number to its conjugate.",
  euler:"Connects complex exponentials with sine and cosine.",
  det2:"Determinant of a 2×2 matrix.",
  inv2:"Inverse of a nonsingular 2×2 matrix.",
  dot:"Dot product of two vectors.",
  matmul:"Element rule for matrix multiplication."
});

const REFERENCE_CALCULATORS=Object.freeze({
  slope:Object.freeze({calcExpression:"(y2-y1)/(x2-x1)",variables:[
    {id:"x1",labelEn:"x₁",labelAr:"x₁"},{id:"y1",labelEn:"y₁",labelAr:"y₁"},
    {id:"x2",labelEn:"x₂",labelAr:"x₂"},{id:"y2",labelEn:"y₂",labelAr:"y₂"}
  ]}),
  percent:Object.freeze({calcExpression:"part/whole*100",variables:[
    {id:"part",labelEn:"Part",labelAr:"الجزء"},{id:"whole",labelEn:"Whole",labelAr:"الكل",nonZero:true}
  ],unit:"%"}),
  pyth:Object.freeze({calcExpression:"sqrt(a^2+b^2)",variables:[
    {id:"a",labelEn:"Leg a",labelAr:"الضلع a",min:0},{id:"b",labelEn:"Leg b",labelAr:"الضلع b",min:0}
  ]}),
  "tri-area":Object.freeze({calcExpression:"b*h/2",variables:[
    {id:"b",labelEn:"Base",labelAr:"القاعدة",min:0},{id:"h",labelEn:"Perpendicular height",labelAr:"الارتفاع العمودي",min:0}
  ],unit:"²"}),
  "rect-area":Object.freeze({calcExpression:"l*w",variables:[
    {id:"l",labelEn:"Length",labelAr:"الطول",min:0},{id:"w",labelEn:"Width",labelAr:"العرض",min:0}
  ],unit:"²"}),
  "circle-area":Object.freeze({calcExpression:"pi*r^2",variables:[{id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0}],unit:"²"}),
  "circle-circ":Object.freeze({calcExpression:"2*pi*r",variables:[{id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0}]}),
  "sphere-vol":Object.freeze({calcExpression:"4*pi*r^3/3",variables:[{id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0}],unit:"³"}),
  "sphere-area":Object.freeze({calcExpression:"4*pi*r^2",variables:[{id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0}],unit:"²"}),
  "cyl-vol":Object.freeze({calcExpression:"pi*r^2*h",variables:[
    {id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0},{id:"h",labelEn:"Height",labelAr:"الارتفاع",min:0}
  ],unit:"³"}),
  "cone-vol":Object.freeze({calcExpression:"pi*r^2*h/3",variables:[
    {id:"r",labelEn:"Radius",labelAr:"نصف القطر",min:0},{id:"h",labelEn:"Height",labelAr:"الارتفاع",min:0}
  ],unit:"³"}),
  zscore:Object.freeze({calcExpression:"(x-mu)/sigma",variables:[
    {id:"x",labelEn:"Value x",labelAr:"القيمة x"},{id:"mu",labelEn:"Mean μ",labelAr:"المتوسط μ"},
    {id:"sigma",labelEn:"Standard deviation σ",labelAr:"الانحراف المعياري σ",exclusiveMin:0}
  ]}),
  "arith-n":Object.freeze({calcExpression:"a1+(n-1)*d",variables:[
    {id:"a1",labelEn:"First term a₁",labelAr:"الحد الأول a₁"},{id:"n",labelEn:"Term number n",labelAr:"رقم الحد n",min:1},
    {id:"d",labelEn:"Common difference d",labelAr:"الفرق المشترك d"}
  ]}),
  "arith-sum":Object.freeze({calcExpression:"n*(a1+an)/2",variables:[
    {id:"n",labelEn:"Number of terms n",labelAr:"عدد الحدود n",min:1},{id:"a1",labelEn:"First term a₁",labelAr:"الحد الأول a₁"},
    {id:"an",labelEn:"Nth term aₙ",labelAr:"الحد النوني aₙ"}
  ]}),
  "geo-n":Object.freeze({calcExpression:"a1*r^(n-1)",variables:[
    {id:"a1",labelEn:"First term a₁",labelAr:"الحد الأول a₁"},{id:"r",labelEn:"Common ratio r",labelAr:"النسبة المشتركة r"},
    {id:"n",labelEn:"Term number n",labelAr:"رقم الحد n",min:1}
  ]}),
  "geo-sum":Object.freeze({calcExpression:"a1*(1-r^n)/(1-r)",variables:[
    {id:"a1",labelEn:"First term a₁",labelAr:"الحد الأول a₁"},{id:"r",labelEn:"Common ratio r",labelAr:"النسبة المشتركة r",notEqual:1},
    {id:"n",labelEn:"Number of terms n",labelAr:"عدد الحدود n",min:1}
  ]}),
  "geo-inf":Object.freeze({calcExpression:"a1/(1-r)",variables:[
    {id:"a1",labelEn:"First term a₁",labelAr:"الحد الأول a₁"},{id:"r",labelEn:"Common ratio r",labelAr:"النسبة المشتركة r",absLessThan:1}
  ]})
});

export const FORMULAS = Object.freeze(RAW_FORMULAS.map(x=>Object.freeze({...x,descriptionEn:EN_DESCRIPTIONS[x.id]??x.titleEn,calculator:REFERENCE_CALCULATORS[x.id]??null})));

export function filterFormulas({category="all",query=""}={}){
  const q=String(query).trim().toLowerCase();
  return FORMULAS.filter(x=>{
    if(category!=="all"&&x.category!==category)return false;
    if(!q)return true;
    const hay=[x.titleAr,x.titleEn,x.formula,x.descriptionAr,x.descriptionEn,...x.tags].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
