const tool=(id,labelEn,labelAr,status="planned")=>({id,labelEn,labelAr,status});
export const CALCULATOR_CATEGORIES=Object.freeze([
  {id:"biology",labelEn:"Biology",labelAr:"الأحياء",tools:[]},
  {id:"chemistry",labelEn:"Chemistry",labelAr:"الكيمياء",tools:[]},
  {id:"construction",labelEn:"Construction",labelAr:"الإنشاءات",tools:[tool("ramp","Ramp Calculator","حاسبة المنحدر","available")]},
  {id:"conversion",labelEn:"Conversion",labelAr:"التحويل",tools:[tool("converter","Unit Converter","محوّل الوحدات","available")]},
  {id:"ecology",labelEn:"Ecology",labelAr:"البيئة",tools:[]},
  {id:"everyday",labelEn:"Everyday life",labelAr:"الحياة اليومية",tools:[tool("date","Date Calculator","حاسبة التاريخ","available")]},
  {id:"finance",labelEn:"Finance",labelAr:"التمويل",tools:[]},
  {id:"food",labelEn:"Food",labelAr:"الغذاء",tools:[]},
  {id:"health",labelEn:"Health",labelAr:"الصحة",tools:[]},
  {id:"math",labelEn:"Math",labelAr:"الرياضيات",tools:[
    tool("calculator","Scientific Calculator","الحاسبة العلمية","available"),
    tool("advanced","Advanced Solver","الحل المتقدم","available"),
    tool("graphing","Graphing Calculator","حاسبة الرسوم البيانية","available"),
    tool("mathlab","Math Lab","مختبر الرياضيات","available"),
    tool("programmer","Programmer Calculator","حاسبة المبرمج","available")
  ]},
  {id:"physics",labelEn:"Physics",labelAr:"الفيزياء",tools:[]},
  {id:"sports",labelEn:"Sports",labelAr:"الرياضة",tools:[]},
  {id:"statistics",labelEn:"Statistics",labelAr:"الإحصاء",tools:[]},
  {id:"other",labelEn:"Other",labelAr:"أخرى",tools:[tool("formulas","Formula Library","مكتبة القوانين","available")]}
]);
