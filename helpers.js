const util = require("util");
const fs = require("fs/promises");
const childProcess = require("child_process");

async function asyncExec(params) {
  const {
    command,
    onProgressFn,
    options = {},
  } = params;

  let childProcessInstance;
  try {
    childProcessInstance = childProcess.exec(command, options);
  } catch (error) {
    throw new Error(error);
  }

  childProcessInstance.stdout.on("data", (data) => {
    onProgressFn?.(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    onProgressFn?.(data);
  });

  try {
    await util.promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    // useful error message appears in Activity Log, this error is just "1".
    // eslint-disable-next-line no-throw-literal
    throw "";
  }

  if (options.jsonOutput) {
    const resultObj = tryParseJson(await tryGetFileContent(".tmp_a3c7db29ad4.json"));
    await tryDeleteFile(".tmp_a3c7db29ad4.json");
    if (resultObj) {
      return resultObj;
    }
  }

  return "";
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return "";
  }
}

async function tryGetFileContent(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    return `{"Error":"Failed to read content of file at ${filePath}"}`;
  }
}

async function tryDeleteFile(filePath) {
  try {
    return await fs.unlink(filePath);
  } catch (error) {
    return error;
  }
}

module.exports = {
  asyncExec,
};
