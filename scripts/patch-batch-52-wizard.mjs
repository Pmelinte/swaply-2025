import { readFileSync, writeFileSync } from "node:fs";

const filePath = "src/app/[locale]/objects/new/ObjectWizardClient.tsx";
let source = readFileSync(filePath, "utf8");

function replaceExactlyOnce(search, replacement, label) {
  const occurrences = source.split(search).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${occurrences}`);
  }
  source = source.replace(search, replacement);
}

replaceExactlyOnce(
  'import { getSupabaseClient } from "@/lib/supabase/client";\n',
  'import { getSupabaseClient } from "@/lib/supabase/client";\nimport { normalizeObjectWizardItemInsert } from "@/lib/items/normalize-object-wizard-insert";\n',
  "normalizer import",
);

replaceExactlyOnce(
  "  const handlePublish = async () => {",
  '  const handlePublish = async (requestedStatus: FormData["status"] = form.status) => {',
  "handlePublish signature",
);

replaceExactlyOnce(
  "      const payload = {\n",
  "      const legacyPayload = {\n",
  "legacy payload declaration",
);

replaceExactlyOnce(
  "        status: form.status,\n",
  "        status: requestedStatus,\n",
  "requested status",
);

replaceExactlyOnce(
  `      };\n\n      const { data, error: insertError } = await supabase\n        .from("items")\n        .insert([payload])`,
  `      };\n\n      const payload = normalizeObjectWizardItemInsert(legacyPayload);\n      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {\n        throw new Error("Invalid object payload");\n      }\n\n      const { data, error: insertError } = await supabase\n        .from("items")\n        .insert([payload])`,
  "direct payload normalization",
);

replaceExactlyOnce(
  `                <button\n                  type="button"\n                  onClick={() => {\n                    updateForm({ status: "draft" });\n                    handlePublish();\n                  }}`,
  `                <button\n                  type="button"\n                  onClick={() => void handlePublish("draft")}`,
  "draft submit",
);

replaceExactlyOnce(
  `                <button\n                  type="button"\n                  onClick={() => {\n                    updateForm({ status: "active" });\n                    handlePublish();\n                  }}`,
  `                <button\n                  type="button"\n                  onClick={() => void handlePublish("active")}`,
  "active submit",
);

writeFileSync(filePath, source);
console.log(`Patched ${filePath} directly.`);
