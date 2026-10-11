import * as fs from "fs";
import * as path from "path";
import { MESSAGE_REGISTRY } from "../packages/core/constants/msgRegistry.ts";

interface IFlatDictionary {
  [key: string]: string;
}

// Added feature toggle flag to enable or disable parsing
const ENABLE_TAG_INDEX_CONVERSION = false;

/**
 * Transforms inline HTML and custom semantic markup tags into sequential numerical index keys.
 */
const convertHtmlTagsToIndexes = (htmlStr: string): string => {
  if (!ENABLE_TAG_INDEX_CONVERSION) {
    return htmlStr;
  }

  if (!htmlStr || typeof htmlStr !== "string" || !htmlStr.includes("<")) {
    return htmlStr;
  }
  let processedStr = htmlStr;
  const tagList: string[] = [];

  const openTagRegex = /<([a-zA-Z0-9]+)(?:\s+[^>]*)*>/g;
  let match: RegExpExecArray | null;

  while ((match = openTagRegex.exec(htmlStr)) !== null) {
    const tagName = match[1]!;
    if (!tagList.includes(tagName)) {
      tagList.push(tagName);
    }
  }

  tagList.forEach((tagName, index) => {
    const openRegex = new RegExp(`<${tagName}(?:\\s+[^>]*)*>`, "g");
    const closeRegex = new RegExp(`</${tagName}>`, "g");

    processedStr = processedStr.replace(openRegex, `<${index}>`);
    processedStr = processedStr.replace(closeRegex, `</${index}>`);
  });

  return processedStr;
};

/**
 * Flattens nested translation registries into dot-notated string key-value mappings.
 */
const flattenObject = (obj: any, prefix = ""): IFlatDictionary => {
  let results: IFlatDictionary = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "function") {
      const funcStr = obj[key].toString();
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      const rawParams = paramMatch && paramMatch[1] ? paramMatch[1].trim() : "";

      let evaluated: any;
      if (rawParams) {
        if (rawParams.startsWith("{") && rawParams.endsWith("}")) {
          const cleanedObjParams = rawParams.slice(1, -1).trim();
          const args = cleanedObjParams
            .split(",")
            .map((p: any) => p.trim().split("=")[0]!.trim());
          const dynamicArgsObj = args.reduce((acc: any, arg: any) => {
            if (arg) acc[arg] = `{{${arg}}}`;
            return acc;
          }, {});
          evaluated = obj[key](dynamicArgsObj);
        } else {
          const args = rawParams.split(",").map((p: any) => {
            const cleanParam = p
              .trim()
              .split(":")[0]!
              .trim()
              .split("=")[0]!
              .trim();
            return `{{${cleanParam}}}`;
          });
          evaluated = obj[key](...args);
        }
      } else {
        evaluated = obj[key]();
      }

      const rawKey = evaluated.tKey || currentKey;
      const cleanKey = rawKey.includes(":") ? rawKey.split(":")[1]! : rawKey;

      results[cleanKey] = convertHtmlTagsToIndexes(evaluated.tValue);
    } else if (
      obj[key] &&
      typeof obj[key] === "object" &&
      "tKey" in obj[key] &&
      "tValue" in obj[key]
    ) {
      const rawKey = obj[key].tKey;
      const cleanKey = rawKey.includes(":") ? rawKey.split(":")[1]! : rawKey;

      results[cleanKey] = convertHtmlTagsToIndexes(obj[key].tValue);
    } else if (obj[key] && typeof obj[key] === "object") {
      Object.assign(results, flattenObject(obj[key], currentKey));
    } else if (typeof obj[key] === "string") {
      results[currentKey] = obj[key];
    }
  }
  return results;
};

/**
 * Reconstructs nested objects from flat dot-notated string key representations.
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
 * Extracts updated, newly added, and deleted messages into locale/versions/updates.json without updating English JSONs.
 */
const extractUpdates = (): void => {
  const localeDir = path.resolve(process.cwd(), "./locale");
  const baseEnPath = path.join(localeDir, "versions/en");
  const updatesFilePath = path.join(localeDir, "versions/updates.json");

  let updatesJson: Record<string, Record<string, any>> = {};
  if (fs.existsSync(updatesFilePath)) {
    try {
      updatesJson = JSON.parse(
        fs.readFileSync(updatesFilePath, "utf-8") || "{}",
      );
    } catch (err) {
      updatesJson = {};
    }
  }

  const enUpdates: Record<string, any> = {};
  const deletedKeysMap: Record<string, string[]> = {};

  for (const namespace in MESSAGE_REGISTRY) {
    if (!Object.prototype.hasOwnProperty.call(MESSAGE_REGISTRY, namespace))
      continue;

    const jsonFilePath = path.join(baseEnPath, `${namespace}.json`);
    const targetRegistry = (MESSAGE_REGISTRY as any)[namespace];

    let existingJsonStructure = {};
    if (fs.existsSync(jsonFilePath)) {
      try {
        const rawJsonContent = fs.readFileSync(jsonFilePath, "utf-8");
        existingJsonStructure = JSON.parse(rawJsonContent || "{}");
      } catch (err) {
        console.warn(
          `Could not parse existing JSON file for namespace "${namespace}". Reading as empty.`,
        );
      }
    }

    const flattenedJson = flattenObject(existingJsonStructure);
    const flattenedRegistry = flattenObject(targetRegistry);

    const updatedKeys: string[] = [];
    const addedKeys: string[] = [];
    const deletedKeys: string[] = [];
    const namespaceDiffs: IFlatDictionary = {};

    for (const registryKey in flattenedRegistry) {
      const registryValue = flattenedRegistry[registryKey]!;
      if (registryKey in flattenedJson) {
        if (flattenedJson[registryKey] !== registryValue) {
          namespaceDiffs[registryKey] = registryValue;
          updatedKeys.push(registryKey);
        }
      } else {
        namespaceDiffs[registryKey] = registryValue;
        addedKeys.push(registryKey);
      }
    }

    for (const jsonKey in flattenedJson) {
      if (!(jsonKey in flattenedRegistry)) {
        deletedKeys.push(jsonKey);
      }
    }

    if (Object.keys(namespaceDiffs).length > 0) {
      enUpdates[namespace] = unflattenObject(namespaceDiffs);
    }

    if (deletedKeys.length > 0) {
      deletedKeysMap[namespace] = deletedKeys;
    }

    console.log(
      `Namespace [${namespace}] checked: Staged ${addedKeys.length} added, ${updatedKeys.length} updated, ${deletedKeys.length} deleted keys.`,
    );
  }

  if (Object.keys(deletedKeysMap).length > 0) {
    enUpdates["_deletedKeys"] = deletedKeysMap;
  }

  updatesJson["en"] = enUpdates;

  const updatesDir = path.dirname(updatesFilePath);
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }

  fs.writeFileSync(
    updatesFilePath,
    JSON.stringify(updatesJson, null, 2),
    "utf-8",
  );

  console.log(
    `Extraction complete. Staged updates in locale/versions/updates.json. Original files untouched until merge.`,
  );
};

extractUpdates();

/**
 * Synchronizes key structures between code registries and structural localized JSON output files.
 */
// const syncRegistryFiles = (): void => {
//   const basePath = path.resolve(process.cwd(), "./locale/versions/en");

//   for (const namespace in MESSAGE_REGISTRY) {
//     if (!Object.prototype.hasOwnProperty.call(MESSAGE_REGISTRY, namespace))
//       continue;

//     const jsonFilePath = path.join(basePath, `${namespace}.json`);
//     const targetRegistry = (MESSAGE_REGISTRY as any)[namespace];

//     let existingJsonStructure = {};
//     if (fs.existsSync(jsonFilePath)) {
//       try {
//         const rawJsonContent = fs.readFileSync(jsonFilePath, "utf-8");
//         existingJsonStructure = JSON.parse(rawJsonContent || "{}");
//       } catch (err) {
//         console.warn(
//           `Could not parse existing JSON file for namespace "${namespace}". Overwriting clean.`,
//         );
//       }
//     } else {
//       const dir = path.dirname(jsonFilePath);
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }
//     }

//     const flattenedJson = flattenObject(existingJsonStructure);
//     const flattenedRegistry = flattenObject(targetRegistry);

//     const updatedKeys: string[] = [];
//     const addedKeys: string[] = [];
//     const deletedKeys: string[] = [];
//     const synchronizedFlatResult: IFlatDictionary = {};

//     for (const registryKey in flattenedRegistry) {
//       const registryValue = flattenedRegistry[registryKey]!;
//       if (registryKey in flattenedJson) {
//         if (flattenedJson[registryKey] !== registryValue) {
//           synchronizedFlatResult[registryKey] = registryValue;
//           updatedKeys.push(registryKey);
//         } else {
//           synchronizedFlatResult[registryKey] = flattenedJson[registryKey]!;
//         }
//       } else {
//         synchronizedFlatResult[registryKey] = registryValue;
//         addedKeys.push(registryKey);
//       }
//     }

//     for (const jsonKey in flattenedJson) {
//       if (!(jsonKey in flattenedRegistry)) {
//         deletedKeys.push(jsonKey);
//       }
//     }

//     if (
//       addedKeys.length === 0 &&
//       updatedKeys.length === 0 &&
//       deletedKeys.length === 0
//     ) {
//       console.log(
//         `Namespace [${namespace}]: Fully synchronized. No updates needed.`,
//       );
//       continue;
//     }

//     const updatedNestedStructure = unflattenObject(synchronizedFlatResult);
//     fs.writeFileSync(
//       jsonFilePath,
//       JSON.stringify(updatedNestedStructure, null, 2),
//       "utf-8",
//     );

//     console.log(
//       `Namespace [${namespace}] synced: Added ${addedKeys.length} keys, Updated ${updatedKeys.length} keys, Removed ${deletedKeys.length} keys.`,
//     );

//     if (addedKeys.length > 0) {
//       addedKeys.forEach((key) => console.log(`  + ${key}`));
//     }
//     if (updatedKeys.length > 0) {
//       updatedKeys.forEach((key) => console.log(`  ~ ${key}`));
//     }
//     if (deletedKeys.length > 0) {
//       deletedKeys.forEach((key) => console.log(`  - ${key}`));
//     }
//   }
// };

// syncRegistryFiles();
