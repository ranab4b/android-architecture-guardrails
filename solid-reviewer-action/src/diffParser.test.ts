import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDiff } from "./diffParser";

const SAMPLE_DIFF = `diff --git a/sample-app/data/src/main/kotlin/com/guardrails/data/sync/UserSyncService.kt b/sample-app/data/src/main/kotlin/com/guardrails/data/sync/UserSyncService.kt
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/sample-app/data/src/main/kotlin/com/guardrails/data/sync/UserSyncService.kt
@@ -0,0 +1,10 @@
+package com.guardrails.data.sync
+
+class UserSyncService {
+    fun syncUser(id: String) {
+        // fetches over the network AND formats UI strings
+    }
+
+    fun formatForDisplay(id: String): String = id.uppercase()
+}
diff --git a/README.md b/README.md
index 2222222..3333333 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,3 @@
 # Title
+Some new line
 Footer
`;

test("parseDiff keeps only Kotlin files", () => {
  const files = parseDiff(SAMPLE_DIFF);
  assert.equal(files.length, 1);
  assert.equal(files[0].path, "sample-app/data/src/main/kotlin/com/guardrails/data/sync/UserSyncService.kt");
});

test("parseDiff assigns correct new-file line numbers to added lines", () => {
  const files = parseDiff(SAMPLE_DIFF);
  const added = files[0].addedLines;
  assert.equal(added.length, 9);
  assert.equal(added[0].lineNumber, 1);
  assert.equal(added[0].content, "package com.guardrails.data.sync");
  assert.equal(added[2].content, "class UserSyncService {");
  assert.equal(added[8].lineNumber, 9);
  assert.equal(added[8].content, "}");
});

test("parseDiff returns nothing for a diff with no Kotlin changes", () => {
  const diff = `diff --git a/README.md b/README.md
index 2222222..3333333 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,3 @@
 # Title
+Some new line
 Footer
`;
  assert.deepEqual(parseDiff(diff), []);
});
