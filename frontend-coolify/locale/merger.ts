import * as fs from "fs";
import * as path from "path";

interface IFlatDictionary {
  [key: string]: string;
}

/**
 * Recursively flattens a nested object structure into dot-notated string key-value pairs.
 */
const flattenObject = (obj: any, prefix = ""): IFlatDictionary => {
  let results: IFlatDictionary = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === "object") {
      Object.assign(results, flattenObject(obj[key], currentKey));
    } else if (typeof obj[key] === "string") {
      results[currentKey] = obj[key];
    }
  }
  return results;
};

/**
 * Reconstructs a deep nested object hierarchy out of dot-notated structural paths.
 */
const unflattenObject = (data: IFlatDictionary): any => {
  const result: any = {};
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        current[part] = data[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
};

/**
 * Reads locale/updates.json, applies additions/updates, removes deleted keys, and syncs locale files.
 */
const mergeUpdates = (): void => {
  const localeDir = path.resolve(process.cwd(), "./locale");
  const updatesFilePath = path.join(localeDir, "versions/updates.json");

  if (!fs.existsSync(updatesFilePath)) {
    console.log("No updates.json file found. Skipping merge.");
    return;
  }

  let updatesJson: Record<string, Record<string, any>> = {};
  try {
    updatesJson = JSON.parse(fs.readFileSync(updatesFilePath, "utf-8") || "{}");
  } catch (err) {
    console.error("Failed to parse locale/updates.json");
    return;
  }

  const languages = Object.keys(updatesJson);
  if (languages.length === 0) {
    console.log("No updates found in updates.json.");
    return;
  }

  const globalDeletedKeys: Record<string, string[]> =
    updatesJson["en"]?._deletedKeys || {};

  for (const lang of languages) {
    const langUpdates = updatesJson[lang] || {};
    const langDirPath = path.join(localeDir, "versions", lang);

    if (!fs.existsSync(langDirPath)) {
      fs.mkdirSync(langDirPath, { recursive: true });
    }

    const namespaces = new Set([
      ...Object.keys(langUpdates).filter((ns) => ns !== "_deletedKeys"),
      ...Object.keys(globalDeletedKeys),
    ]);

    for (const namespace of namespaces) {
      const targetJsonPath = path.join(langDirPath, `${namespace}.json`);
      let existingTargetData = {};

      if (fs.existsSync(targetJsonPath)) {
        try {
          existingTargetData = JSON.parse(
            fs.readFileSync(targetJsonPath, "utf-8") || "{}",
          );
        } catch (err) {
          existingTargetData = {};
        }
      }

      const flatExisting = flattenObject(existingTargetData);
      const flatUpdates = langUpdates[namespace]
        ? flattenObject(langUpdates[namespace])
        : {};

      const mergedFlat = { ...flatExisting, ...flatUpdates };

      const deletedKeysForNs = globalDeletedKeys[namespace] || [];
      deletedKeysForNs.forEach((deletedKey) => {
        delete mergedFlat[deletedKey];
      });

      const mergedNested = unflattenObject(mergedFlat);

      fs.writeFileSync(
        targetJsonPath,
        JSON.stringify(mergedNested, null, 2),
        "utf-8",
      );

      console.log(
        `Synced updates for [${lang}] namespace [${namespace}]: Applied diffs & cleaned ${deletedKeysForNs.length} deleted keys.`,
      );
    }
  }

  fs.writeFileSync(updatesFilePath, JSON.stringify({}, null, 2), "utf-8");
  console.log(
    "Successfully merged all updates, cleaned obsolete keys, and reset updates.json.",
  );
};

mergeUpdates();
