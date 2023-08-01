import * as fs from "fs";
interface DidData {
  did: string;
}

export interface CheqdData {
  cheqd: {
    [key: string]: DidData;
  };
}

export class UniversityCredentialsContainer {
  constructor(name = "Fanco", degree = "Filosofia", date = "in corso") {
    this._name = name;
    this._degree = degree;
    this._date = date;
  }
  public _name: string;
  public _degree: string;
  public _date: string;
}

export function readJsonFile(filename: string): CheqdData | null {
  try {
    if (!fs.existsSync(filename)) {
      console.error("File not found:", filename);
      return null;
    }

    const rawData = fs.readFileSync(filename, "utf-8");
    const jsonData = JSON.parse(rawData);

    if (!jsonData || !jsonData.cheqd || !jsonData.cheqd.demo) {
      console.error("Invalid JSON data format:", jsonData);
      return null;
    }

    return jsonData;
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return null;
  }
}

export function writeJsonFile(filename: string, data: CheqdData): void {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonData, "utf-8");
    console.log("Data written to", filename);
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}
