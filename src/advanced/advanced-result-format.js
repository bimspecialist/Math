const joinLines=obj=>Object.entries(obj).map(([k,v])=>`${k} = ${v}`).join("\n");

export function formatAdvancedResult(r){
  if(!r)return"";
  if(r.kind==="value")return`= ${r.exact??r.numeric}`;
  if(r.kind==="solution-set")return`${r.variable} = ${r.solutions.join(", ")}`;
  if(r.kind==="system-solution")return joinLines(r.values);
  if(r.kind==="parametric-system"){
    const body=joinLines(r.expressions);
    const free=r.freeVariables?.length?`\nFree: ${r.freeVariables.join(", ")}`:"";
    return body+free;
  }
  if(r.kind==="expression-analysis"){
    const roots=r.roots?.length?r.roots.join(", "):"none";
    return`Expression: ${r.expression}\nDegree: ${r.degree}\nRoots: ${roots}`;
  }
  if(r.kind==="identity")return"All values satisfy the equation";
  if(r.kind==="equation-check")return r.equal?"المعادلة صحيحة":"طرفا المعادلة غير متساويين";
  const messages={
    EMPTY_INPUT:"اكتب تعبيرًا أو معادلة أولًا.",
    VARIABLE_REQUIRES_EQUATION:"أضف علامة = إذا كنت تريد حل قيمة مجهول.",
    INVALID_EQUATION:"صيغة المعادلة غير صحيحة.",
    INVALID_EXPRESSION:"تعذر قراءة التعبير.",
    NO_SOLUTION:"لا يوجد حل للنظام أو المعادلة.",
    NON_POLYNOMIAL_SOLVER_PENDING:"هذه المعادلة تحتاج محرك CAS أوسع وسيتم إضافته في المرحلة التالية.",
    NONLINEAR_SYSTEM_NOT_YET_SUPPORTED:"النظام غير الخطي متعدد المجاهيل سيُدعَم في المرحلة التالية.",
    SYMBOLIC_ANALYSIS_PENDING:"التحليل الرمزي لهذا التعبير سيُدعَم في المرحلة التالية.",
    NO_NUMERIC_SOLUTION:"لم يتم العثور على حل عددي.",
    DIVISION_BY_ZERO:"قسمة على صفر.",
    DOMAIN_ERROR:"القيمة خارج مجال الدالة.",
    UNSUPPORTED_OPERATION:"العملية غير مدعومة حاليًا."
  };
  const suffix=r.variables?.length?` (${r.variables.join(", ")})`:"";
  return (messages[r.code]??r.code??"Unknown result")+suffix;
}
