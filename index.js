import { doAction } from './action.js';
import * as core from '@actions/core';

(async function() {
    try {
        await doAction();
    } catch (error) {
        core.setFailed(error.message);
    }
})();
