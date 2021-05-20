const { SlashCommand, Constants } = require("slash-create");
const { CommandOptionType, PermissionNames } = Constants

function validateOptions(options, prefix = "options") {
    function throwError(error = Error, index, reason, suffix = "") {
        throw new error(`Command ${prefix}[${index}]${suffix}: ${reason}`);
    }
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (! option.type || ! CommandOptionType[option.type])
            throwError(Error, i, "Option type is invalid.");
        if (typeof option.name !== "string")
            throwError(TypeError, i, "Option name must be a string.");
        if (option.name !== option.name.toLowerCase())
            throwError(Error, i, "Option name must be lowercase.");
        // if (! /^[\w-]{1,32}$/.test(option.name))
        //     throwError(RangeError, i, "Option name must must be under 32 characters, matching this regex: /^[\\w-]{1,32}$/");
        if (typeof option.description !== "string")
            throwError(TypeError, i, "Option description must be a string.");
        if (option.description.length < 1 || option.description.length > 100)
            throwError(RangeError, i, "Option description must be under 100 characters.");
        if (option.options) {
            if (option.type !== CommandOptionType.SUB_COMMAND && option.type !== CommandOptionType.SUB_COMMAND_GROUP)
                throwError(Error, i, "You cannot use the `options` field in options that are not sub-commands or sub-command groups!");
            if (option.options.length > 25)
                throwError(Error, i, "The sub-command (group) options exceed 25 commands/options!");
            validateOptions(option.options, `options[${i}].options`);
        }
        if (option.choices) {
            if (option.type === CommandOptionType.SUB_COMMAND ||
                option.type === CommandOptionType.SUB_COMMAND_GROUP ||
                option.type === CommandOptionType.BOOLEAN)
                throwError(Error, i, "You cannot use the `choices` field in options that are sub-commands, sub-command groups or booleans!");
            if (option.choices.length > 25)
                throwError(Error, i, "The choices exceed 25 commands/options!");
            for (let ii = 0; ii < option.choices.length; ii++) {
                const choice = option.choices[ii];
                if (! choice.name || choice.name.length > 100)
                    throwError(RangeError, i, "The choice name must be not exceed 100 characters!", `.choices[${ii}]`);
            }
        }
    }
}

SlashCommand.validateOptions = (opts) => {
  if (typeof opts.name !== "string")
    throw new TypeError("Command name must be a string.");
  if (opts.name !== opts.name.toLowerCase())
    throw new Error("Command name must be lowercase.");
  // if (! /^[\w-]{1,32}$/.test(opts.name))
  //     throw new RangeError("Command name must be under 32 characters, matching this regex: /^[\\w-]{1,32}$/");
  if (typeof opts.description !== "string")
    throw new TypeError("Command description must be a string.");
  if (opts.description.length < 1 || opts.description.length > 100)
    throw new RangeError("Command description must be under 100 characters.");
  if (opts.options) {
    if (! Array.isArray(opts.options))
      throw new TypeError("Command options must be an array of options.");
    if (opts.options.length > 25)
      throw new RangeError("Command options cannot exceed 25 options.");
    validateOptions(opts.options);
  }
  if (opts.requiredPermissions) {
    if (! Array.isArray(opts.requiredPermissions))
      throw new TypeError(
        "Command required permissions must be an Array of permission key strings."
      );
    for (const perm of opts.requiredPermissions)
      if (! PermissionNames[perm])
        throw new RangeError(`Invalid command required permission: ${perm}`);
  }
  if (opts.throttling) {
    if (typeof opts.throttling !== "object")
      throw new TypeError("Command throttling must be an Object.");
    if (
      typeof opts.throttling.usages !== "number" ||
      isNaN(opts.throttling.usages)
    ) {
      throw new TypeError("Command throttling usages must be a number.");
    }
    if (opts.throttling.usages < 1)
      throw new RangeError("Command throttling usages must be at least 1.");
    if (
      typeof opts.throttling.duration !== "number" ||
      isNaN(opts.throttling.duration)
    ) {
      throw new TypeError("Command throttling duration must be a number.");
    }
    if (opts.throttling.duration < 1)
      throw new RangeError("Command throttling duration must be at least 1.");
  }
};

module.exports = SlashCommand;
