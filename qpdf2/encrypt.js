
const { execute } = require('./spawn.js');
const { fileExists, hyphenate } = require('./utils.js');

const EncryptDefaults = {
    keyLength: 256,
    overwrite: true,
};

exports.encryptPdf = async function (userPayload) {
    const payload = { ...EncryptDefaults, ...userPayload };
    // Check if the file exists
    if (!payload.input)
        throw new Error("Please specify input file");
    if (!fileExists(payload.input))
        throw new Error("Input file doesn't exist");
    if (payload.output && !payload.overwrite && fileExists(payload.output))
        throw new Error("Output file already exists");
    const callArguments = [];
    // If the keyLength is 40, `--allow-weak-crypto` needs to be specified before `--encrypt`.
    // This is required for qpdf 11+.
    if (payload.keyLength === 40)
        callArguments.push("--allow-weak-crypto");
    callArguments.push("--encrypt");
    // Set user-password and owner-password
    if (typeof payload.password === "object") {
        if (payload.password.user === undefined ||
            payload.password.owner === undefined) {
            // TODO: If the keyLength is 256 AND there is no owner password, `--allow-insecure` can be used
            throw new Error("Please specify both owner and user passwords");
        }
        callArguments.push(payload.password.user, payload.password.owner);
    }
    else if (typeof payload.password === "string") {
        // Push twice for user-password and owner-password
        callArguments.push(payload.password, payload.password);
    }
    else {
        callArguments.push("", "");
    }
    // Specifying the key length
    callArguments.push(payload.keyLength.toString());
    // Add Restrictions for encryption
    if (payload.restrictions) {
        if (typeof payload.restrictions !== "object")
            throw new Error("Invalid Restrictions");
        for (const [restriction, value] of Object.entries(payload.restrictions)) {
            // cleartextMetadata does not have a value
            if (restriction === "cleartextMetadata" && value === true) {
                callArguments.push(`--${hyphenate(restriction)}`);
            }
            if (restriction === "useAes" && payload.keyLength === 256) {
                // use-aes is always on with 256 bit keyLength
            }
            else {
                callArguments.push(`--${hyphenate(restriction)}=${value}`);
            }
        }
    }
    callArguments.push("--", payload.input);
    if (payload.output) {
        if (payload.input === payload.output && payload.overwrite) {
            callArguments.push("--replace-input");
        }
        else {
            callArguments.push(payload.output);
        }
    }
    else {
        // Print PDF on stdout
        callArguments.push("-");
    }
    // Execute command and return stdout for pipe
    return execute(callArguments);
}