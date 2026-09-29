const joinLines=obj=>Object.entries(obj).map(([k,v])=>`${k} = ${v}`).join("\n");

const TEXT={
  en:{
    free:"Free",expression:"Expression",degree:"Degree",roots:"Roots",none:"none",
    identity:"All values satisfy the equation.",
    equationTrue:"The equation is true.",equationFalse:"The two sides of the equation are not equal.",
    EMPTY_INPUT:"Enter an expression or equation first.",
    VARIABLE_REQUIRES_EQUATION:"Add = if you want to solve for an unknown.",
    INVALID_EQUATION:"The equation format is invalid.",
    INVALID_EXPRESSION:"The expression could not be parsed.",
    NO_SOLUTION:"No solution.",
    NON_POLYNOMIAL_SOLVER_PENDING:"This equation requires a broader CAS engine that is not enabled yet.",
    NONLINEAR_SYSTEM_NOT_YET_SUPPORTED:"This multivariable nonlinear system is not supported yet.",
    SYMBOLIC_ANALYSIS_PENDING:"Symbolic analysis for this expression is not supported yet.",
    NO_NUMERIC_SOLUTION:"No numerical solution was found.",
    DIVISION_BY_ZERO:"Division by zero.",
    DOMAIN_ERROR:"The value is outside the function domain.",
    UNSUPPORTED_OPERATION:"This operation is not supported yet.",
    SYMBOLIC_CALCULUS_UNSUPPORTED:"This symbolic calculus expression is not supported yet.",
    SYMBOLIC_TRANSFORM_UNSUPPORTED:"This symbolic transformation is not supported yet.",
    INVALID_LIMIT:"The limit expression is invalid.",
    LIMIT_DOES_NOT_EXIST:"The two-sided limit does not exist as a finite value.",
    INVALID_NUMERIC_SOLVE:"The numerical solve request is invalid. Use nsolve(equation, variable, guess) or nsolve(equation, variable, min, max).",
    NO_NUMERIC_ROOT:"No numerical root was found from the supplied guess or bracket.",
    numericRoot:"Numerical root",
    method:"Method",
    residual:"Residual",
    unknown:"Unknown result"
  },
  ar:{
    free:"حر",expression:"التعبير",degree:"الدرجة",roots:"الجذور",none:"لا يوجد",
    identity:"كل القيم تحقق المعادلة.",
    equationTrue:"المعادلة صحيحة.",equationFalse:"طرفا المعادلة غير متساويين.",
    EMPTY_INPUT:"اكتب تعبيرًا أو معادلة أولًا.",
    VARIABLE_REQUIRES_EQUATION:"أضف علامة = إذا كنت تريد حل قيمة مجهول.",
    INVALID_EQUATION:"صيغة المعادلة غير صحيحة.",
    INVALID_EXPRESSION:"تعذر تحليل التعبير.",
    NO_SOLUTION:"لا يوجد حل.",
    NON_POLYNOMIAL_SOLVER_PENDING:"تحتاج هذه المعادلة إلى محرك CAS أوسع لم يُفعّل بعد.",
    NONLINEAR_SYSTEM_NOT_YET_SUPPORTED:"هذا النظام غير الخطي متعدد المجاهيل غير مدعوم بعد.",
    SYMBOLIC_ANALYSIS_PENDING:"التحليل الرمزي لهذا التعبير غير مدعوم بعد.",
    NO_NUMERIC_SOLUTION:"لم يتم العثور على حل عددي.",
    DIVISION_BY_ZERO:"قسمة على صفر.",
    DOMAIN_ERROR:"القيمة خارج مجال الدالة.",
    UNSUPPORTED_OPERATION:"هذه العملية غير مدعومة بعد.",
    SYMBOLIC_CALCULUS_UNSUPPORTED:"هذا التعبير الرمزي في التفاضل أو التكامل غير مدعوم بعد.",
    SYMBOLIC_TRANSFORM_UNSUPPORTED:"هذا التحويل الرمزي غير مدعوم بعد.",
    INVALID_LIMIT:"صيغة النهاية غير صحيحة.",
    LIMIT_DOES_NOT_EXIST:"النهاية الثنائية لا توجد كقيمة منتهية.",
    INVALID_NUMERIC_SOLVE:"طلب الحل العددي غير صحيح. استخدم nsolve(المعادلة, المتغير, قيمة ابتدائية) أو nsolve(المعادلة, المتغير, الحد الأدنى, الحد الأعلى).",
    NO_NUMERIC_ROOT:"لم يتم العثور على جذر عددي انطلاقًا من القيمة أو المجال المحدد.",
    numericRoot:"الجذر العددي",
    method:"الطريقة",
    residual:"الباقي",
    unknown:"نتيجة غير معروفة"
  }
};

export function formatAdvancedResult(r,locale="en"){
  if(!r)return"";
  const t=TEXT[locale==="ar"?"ar":"en"];
  if(r.kind==="value")return`= ${r.exact??r.numeric}`;
  if(r.kind==="solution-set")return`${r.variable} = ${r.solutions.join(", ")}`;
  if(r.kind==="system-solution")return joinLines(r.values);
  if(r.kind==="system-solution-set")return r.solutions.map((s,i)=>`#${i+1}: `+Object.entries(s).map(([k,v])=>`${k} = ${v}`).join(", ")).join("\n");
  if(r.kind==="parametric-system"){
    const body=joinLines(r.expressions);
    const free=r.freeVariables?.length?`\n${t.free}: ${r.freeVariables.join(", ")}`:"";
    return body+free;
  }
  if(r.kind==="expression-analysis"){
    const roots=r.roots?.length?r.roots.join(", "):t.none;
    return`${t.expression}: ${r.expression}\n${t.degree}: ${r.degree}\n${t.roots}: ${roots}`;
  }
  if(r.kind==="identity")return t.identity;
  if(r.kind==="equation-check")return r.equal?t.equationTrue:t.equationFalse;
  if(r.kind==="symbolic-calculus"){const label=r.operation==="integral"?(locale==="ar"?"التكامل":"Integral"):(locale==="ar"?"المشتقة":"Derivative");return `${label}: ${r.expression}`;}
  if(r.kind==="symbolic-transform"){const label=r.operation==="expand"?(locale==="ar"?"التوسيع":"Expanded"):(locale==="ar"?"التبسيط":"Simplified");return `${label}: ${r.expression}`;}
  if(r.kind==="limit")return locale==="ar"?`النهاية عندما ${r.variable} ← ${r.point}: ${r.value}`:`Limit as ${r.variable} → ${r.point}: ${r.value}`;
  if(r.kind==="numeric-root"){
    const method=r.method==="bisection"?(locale==="ar"?"التنصيف":"Bisection"):(locale==="ar"?"نيوتن":"Newton");
    return `${t.numericRoot}: ${r.variable} = ${r.value}\n${t.method}: ${method}\n${t.residual}: ${r.residual}`;
  }
  const suffix=r.variables?.length?` (${r.variables.join(", ")})`:"";
  return (t[r.code]??r.code??t.unknown)+suffix;
}
