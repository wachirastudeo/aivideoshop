console.log("--- START INSPECTION ---");
const allBtns = Array.from(document.querySelectorAll("button, [role='button'], a"));
const btnInfo = allBtns.map(b => ({
  text: b.textContent.trim().substring(0, 30),
  tag: b.tagName,
  id: b.id,
  classes: b.className,
  visible: b.offsetWidth > 0 && b.offsetHeight > 0
}));
console.table(btnInfo);
console.log("--- END INSPECTION ---");
