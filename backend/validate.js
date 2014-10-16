/*jslint node: true, unparam: true */

'use strict';

var path = require('path'),
    Schema = require('json-schema');

function validateFilename(filename) {
    return (
        path.resolve('/', filename) === '/' + filename
        && path.extname(filename) === '.hs'
    );
}

function validateModuleName(module_name) {
    return (
        /^[A-Za-z0-9\-]*$/.test(module_name)
        && module_name.length <= 50
        && module_name.length > 0
    );
}

function validateModuleVersion(version) {
    return version === null || (
        /^[0-9\.]*$/.test(version)
        && version.length <= 12
        && version.length > 0
    );
}

var filesSchema = {
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            name: {type: 'string', required: true},
            code: {type: 'string', required: true}
        }
    },
    required: true
};

var modulesSchema = {
    type: 'array',
    minItems: 0,
    items: {
        type: 'object',
        properties: {
            name: {type: 'string', required: true},
            version: {type: ['string', 'null'], required: true}
        }
    },
    required: true
};

var executeRequestSchema = {
    type: 'object',
    properties: {
        files: filesSchema,
        modules: modulesSchema
    }
};


function mergeErrors(a, b) {
    return {
        valid: a.valid && b.valid,
        errors: (a.errors || []).concat(b.errors || [])
    };
}

/**
 * Validate file list
 */
exports.files = function (files, prefix) {
    var errors = [];

    files.forEach(function (file, index) {
        if (!validateFilename(file.name)) {
            errors.push({
                property: prefix + '[' + index + '].name',
                message: 'Filename must be relative, and end with .hs'
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors: errors
    };
};

/**
 * Validate module list
 */
exports.modules = function (modules, prefix) {
    var errors = [];

    modules.forEach(function (module, index) {
        if (!validateModuleName(module.name)) {
            errors.push({
                property: prefix + '[' + index + '].name',
                message: 'Module must be [A-Za-z0-9\-] and 50 chars or less'
            });
        }
        if (!validateModuleVersion(module.version)) {
            errors.push({
                property: prefix + '[' + index + '].version',
                message: 'Version must be [0-9\.] and 12 chars or less'
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors: errors
    };
};


/**
 * Validate /execute request
 */
exports.executeRequest = function (body) {
    var validated = Schema.validate(body, executeRequestSchema);

    if (!validated.valid) {
        return validated;
    }

    return mergeErrors(
        exports.files(body.files, 'files'),
        exports.modules(body.modules, 'modules')
    );
};
