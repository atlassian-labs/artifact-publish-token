const action = require('./action.js');
const core = require('@actions/core');

(async function() {
    try {
        await action.doAction();
    } catch (error) {
        core.setFailed(error.message);
    }
})();
