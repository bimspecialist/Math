/**
 * Parse one research data series without dropping missing CSV cells.
 * Accept commas/semicolons or whitespace, including lines pasted from tables.
 * Commas are list separators: decimal fractions use '.' or Arabic '٫'.
 */
const NUMBER_TOKEN=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
export function parseResearchSeries(source){
  if(typeof source!=="string"||!source.trim())return{ok:false,code:"RESEARCH_SERIES_REQUIRED"};
  const normalized=source
    .replace(/[\u0660-\u0669]/g,c=>String(c.charCodeAt(0)-0x660))
    .replace(/[\u06f0-\u06f9]/g,c=>String(c.charCodeAt(0)-0x6f0))
    .replace(/\u066b/g,".")
    .replace(/\u2212/g,"-");
  const trimmed=normalized.trim();
  // Pasted spreadsheet data can encode missing values as empty lines or
  // repeated tabs. Reject those rather than silently shifting a paired series.
  const lines=trimmed.split(/\r\n?|\n|\u2028|\u2029/);
  if(lines.some(line=>!line.replace(/[,;\u060c\u061b]/g,"").trim()))return{ok:false,code:"RESEARCH_SERIES_GAP"};
  if(/\t[ \t]*\t/.test(trimmed))return{ok:false,code:"RESEARCH_SERIES_GAP"};
  const fields=trimmed.split(/[,;\u060c\u061b]/);
  // '1,,3' and trailing/leading delimiters must never be treated as valid data.
  if(fields.some(field=>!field.trim()))return{ok:false,code:"RESEARCH_SERIES_GAP"};
  const tokens=fields.flatMap(field=>field.trim().split(/\s+/));
  const values=[];
  for(const token of tokens){
    if(!NUMBER_TOKEN.test(token))return{ok:false,code:"RESEARCH_SERIES_INVALID"};
    const value=Number(token);
    if(!Number.isFinite(value))return{ok:false,code:"RESEARCH_SERIES_INVALID"};
    values.push(value);
  }
  return{ok:true,values};
}
