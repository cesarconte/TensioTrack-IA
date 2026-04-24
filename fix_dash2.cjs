const fs = require("fs");
let content = fs.readFileSync("src/components/dashboard/Dashboard.tsx", "utf8");
content = content.replace(/ dark:text-\\[#0B0E14\\]/g, "");
content = content.split(" dark:text-[#0B0E14]").join("");
fs.writeFileSync("src/components/dashboard/Dashboard.tsx", content);
console.log("Done");
