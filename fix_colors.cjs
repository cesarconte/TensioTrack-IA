const fs = require("fs");
let content = fs.readFileSync("src/components/AIPredictions.tsx", "utf8");

const replacements = {
  "text-\\[#1A1A1A\\]": "text-foreground",
  "bg-\\[#F2F0F7\\]": "bg-surface-high",
  "bg-\\[#F8F7FB\\]": "bg-surface-low",
  "bg-\\[#EBF7F0\\]": "bg-success/10",
  "text-\\[#4CAF50\\]": "text-success",
  "text-\\[#6B6B6B\\]": "text-on-surface-variant",
  "bg-\\[#FCFBFF\\]": "bg-background",
  "bg-\\[#9C8ED9\\]": "bg-primary/80",
  "shadow-\\[#9C8ED9\\]\\/10": "shadow-primary/10",
  "text-\\[#EFEFEF\\]": "text-primary-foreground/80",
  "text-\\[#514295\\]": "text-primary",
  'fill="#514295"': 'fill="currentColor"',
  "bg-\\[#F3F1FB\\]": "bg-primary/10",
  "bg-\\[#FFF4F2\\]": "bg-destructive/10",
  "text-\\[#F36D61\\]": "text-destructive",
  "text-\\[#7E6FD3\\]": "text-primary",
  "bg-\\[#F4F1FB\\]": "bg-surface-low",
  "border-\\[#EDEAFA\\]": "border-border",
  "border-\\[#F0EDF7\\]": "border-border",
  "bg-\\[#E8E4F5\\]": "bg-surface-highest",
  "bg-\\[#E9E6F0\\]": "bg-surface-highest"
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key, "g");
  content = content.replace(regex, value);
}

fs.writeFileSync("src/components/AIPredictions.tsx", content);
console.log("Done");
