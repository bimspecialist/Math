/**
 * Global keypad shortcuts only belong to the active calculator screen.
 * Inputs, links, buttons and modified shortcuts retain native keyboard behavior.
 */
export function shouldHandleCalculatorShortcut({
  calculatorActive=false,interactiveTarget=false,ctrlKey=false,
  metaKey=false,altKey=false,defaultPrevented=false
}={}){
  return Boolean(calculatorActive&&!interactiveTarget&&!ctrlKey&&!metaKey&&!altKey&&!defaultPrevented);
}
