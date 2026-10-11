import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import { MESSAGES_REGISTRY } from "./packages/shared/src/constants/msgRegistry.ts";

interface IFlatDictionary {
  [key: string]: string;
}

/**
 * Flattens nested translation registries into dot-notated string key-value mappings.
 */
const flattenObject = (obj: any, prefix = ""): IFlatDictionary => {
  let results: IFlatDictionary = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const currentKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === "function") {
      const funcStr = value.toString();
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      const rawParams = paramMatch && paramMatch[1] ? paramMatch[1].trim() : "";

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

          const evaluation = value(dynamicArgsObj);
          if (evaluation && evaluation.i18nKey) {
            results[evaluation.i18nKey] = evaluation.message || "";
          }
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

          const evaluation = value(...args);
          if (evaluation && evaluation.i18nKey) {
            results[evaluation.i18nKey] = evaluation.message || "";
          }
        }
      } else {
        const evaluation = value();
        if (evaluation && evaluation.i18nKey) {
          results[evaluation.i18nKey] = evaluation.message || "";
        }
      }
    } else if (value && typeof value === "object" && "i18nKey" in value) {
      results[value.i18nKey] = value.message || "";
    } else if (value && typeof value === "object") {
      Object.assign(results, flattenObject(value, currentKey));
    } else if (typeof value === "string") {
      results[currentKey] = value;
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
 * Extracts updated and deleted registry keys into updates.json for en:apimessage.
 */
const extractMessageUpdates = (): void => {
  const localeDirPath = path.resolve(
    process.cwd(),
    "../frontend-coolify/locale",
  );
  const jsonFilePath = path.join(localeDirPath, "versions/en/apimessage.json");
  const updatesFilePath = path.join(localeDirPath, "versions/updates.json");

  if (!fs.existsSync(localeDirPath)) {
    fs.mkdirSync(localeDirPath, { recursive: true });
  }

  let existingJsonStructure = {};
  if (fs.existsSync(jsonFilePath)) {
    try {
      const rawJsonContent = fs.readFileSync(jsonFilePath, "utf-8").trim();
      if (rawJsonContent) {
        existingJsonStructure = JSON.parse(rawJsonContent);
      }
    } catch (parseError) {
      console.warn(
        `[WARNING]: Failed to parse ${jsonFilePath}. Reading as blank structure.`,
      );
    }
  }

  let updatesJson: Record<string, any> = {};
  if (fs.existsSync(updatesFilePath)) {
    try {
      const rawUpdates = fs.readFileSync(updatesFilePath, "utf-8").trim();
      if (rawUpdates) {
        updatesJson = JSON.parse(rawUpdates);
      }
    } catch {
      updatesJson = {};
    }
  }

  const flattenedJson = flattenObject(existingJsonStructure);
  const flattenedRegistry = flattenObject(MESSAGES_REGISTRY);

  const updatedKeys: string[] = [];
  const addedKeys: string[] = [];
  const deletedKeys: string[] = [];
  const diffFlatResult: IFlatDictionary = {};

  for (const registryKey in flattenedRegistry) {
    const registryValue = flattenedRegistry[registryKey]!;
    if (registryKey in flattenedJson) {
      if (flattenedJson[registryKey] !== registryValue) {
        diffFlatResult[registryKey] = registryValue;
        updatedKeys.push(registryKey);
      }
    } else {
      diffFlatResult[registryKey] = registryValue;
      addedKeys.push(registryKey);
    }
  }

  for (const jsonKey in flattenedJson) {
    if (!(jsonKey in flattenedRegistry)) {
      deletedKeys.push(jsonKey);
    }
  }

  if (
    addedKeys.length === 0 &&
    updatedKeys.length === 0 &&
    deletedKeys.length === 0
  ) {
    console.log(
      "Registry and locale templates are synchronized. No updates added.",
    );
    return;
  }

  updatesJson["en"] = updatesJson["en"] || {};

  if (Object.keys(diffFlatResult).length > 0) {
    updatesJson["en"]["apimessage"] = unflattenObject(diffFlatResult);
  }

  if (deletedKeys.length > 0) {
    updatesJson["en"]["_deletedKeys"] = updatesJson["en"]["_deletedKeys"] || {};
    updatesJson["en"]["_deletedKeys"]["apimessage"] = deletedKeys;
  }

  fs.mkdirSync(path.dirname(updatesFilePath), { recursive: true });
  fs.writeFileSync(
    updatesFilePath,
    JSON.stringify(updatesJson, null, 2),
    "utf-8",
  );

  console.log(
    `Extraction complete: Staged ${addedKeys.length} added, ${updatedKeys.length} updated, and ${deletedKeys.length} deleted keys into updates.json. Original en/apimessage.json left untouched until merge.`,
  );
};

extractMessageUpdates();
