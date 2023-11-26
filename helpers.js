const util = require("util");
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

  const dataChunks = [];
  const errorChunks = [];

  childProcessInstance.stdout.on("data", (data) => {
    onProgressFn?.(data);
    dataChunks.push(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    onProgressFn?.(data);
    const messagePrefix = "checkov: error: ";
    errorChunks.push(data.split(messagePrefix)[1]);
  });

  try {
    await util.promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    const resultObj = tryParseJson(dataChunks.join(''));
    if (error === 1 && resultObj) {
      throw resultObj;
    }
    const errorObj = {
      exit_code: error,
      error_message: errorChunks?.join('') || "See Activity Log",
    };
    throw errorObj;
  }

  const resultObj = tryParseJson(dataChunks.join());
  if (resultObj) {
    return resultObj;
  }
  return "";
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

module.exports = {
  asyncExec,
};
