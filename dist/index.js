"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lazyCompose_1 = __importDefault(require("./lazyCompose"));
exports.compose = lazyCompose_1.default;
var constant_1 = __importDefault(require("./constant"));
exports.constant = constant_1.default;
exports.default = lazyCompose_1.default;
