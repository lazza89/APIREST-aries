import * as fs from "fs";
interface DidData {
  did: string;
}

export enum IssuerConnectionStatus {
  NOT_CONNECTED,
  REQUESTED,
  CONNECTED,
}

export enum IssuerCredentialStatus {
  NONE,
  ISSUED,
  REVOKED,
  DECLINED,
  ACCEPTED,
}

export enum IssuerProofStatus{
  NONE,
  ON_HOLD,
  INVALID,
  DECLINED,
  ACCEPTED,
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

export enum SchemaAndCredDefInLedger {
  NONE, //schema and credential definition not present
  SCHEMA, //schema present, credential definition not present
  SCHEMA_AND_CRED_DEF, //schema and credential definition present
}

export function readJsonFile(filename: string): any | null {
  try {
    if (!fs.existsSync(filename)) {
      console.error("File not found:", filename);
      return null;
    }

    const rawData = fs.readFileSync(filename, "utf-8");
    const jsonData = JSON.parse(rawData);

    if (!jsonData) {
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
