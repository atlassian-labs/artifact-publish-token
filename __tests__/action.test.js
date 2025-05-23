const core = require('../action.js');
const fs = require('fs').promises;
const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImVCWl9jbjNzWFlBZDBjaDRUSEJLSElnT3dPRSIsImtpZCI6Ijc4MTY3RjcyN0RFQzVEODAxREQxQzg3ODRDNzA0QTFDODgwRUMwRTEifQ.eyJqdGkiOiJmY2JjY2E3MS01ZGVmLTQ2MGItYTYxZC0yNmRhMjNmMThjNWQiLCJzdWIiOiJyZXBvOmF0bGFzc2lhbi1sYWJzL29pZGMtdGVzdDpyZWY6cmVmcy9oZWFkcy9tYWluIiwiYXVkIjoiaHR0cHM6Ly9naXRodWIuY29tL2F0bGFzc2lhbi1sYWJzIiwicmVmIjoicmVmcy9oZWFkcy9tYWluIiwic2hhIjoiNTZmNWUyYjk3YzQ0MzZmNzc5ZWRjODY0NmM1MDJhMTQwNzk1Mzc3MCIsInJlcG9zaXRvcnkiOiJhdGxhc3NpYW4tbGFicy9vaWRjLXRlc3QiLCJyZXBvc2l0b3J5X293bmVyIjoiYXRsYXNzaWFuLWxhYnMiLCJydW5faWQiOiIyMDYxODIyNDEyIiwicnVuX251bWJlciI6IjEyIiwicnVuX2F0dGVtcHQiOiIxIiwiYWN0b3IiOiJyaW5jb25qYyIsIndvcmtmbG93IjoiQ0kiLCJoZWFkX3JlZiI6IiIsImJhc2VfcmVmIjoiIiwiZXZlbnRfbmFtZSI6InB1c2giLCJyZWZfdHlwZSI6ImJyYW5jaCIsImpvYl93b3JrZmxvd19yZWYiOiJhdGxhc3NpYW4tbGFicy9vaWRjLXRlc3QvLmdpdGh1Yi93b3JrZmxvd3MvYmxhbmsueW1sQHJlZnMvaGVhZHMvbWFpbiIsImlzcyI6Imh0dHBzOi8vdG9rZW4uYWN0aW9ucy5naXRodWJ1c2VyY29udGVudC5jb20iLCJuYmYiOjE2NDg1OTg2MzgsImV4cCI6MTY0ODU5OTUzOCwiaWF0IjoxNjQ4NTk5MjM4fQ.2ofeJZ21ASerR_X36CWH5KsJDblQO6sFM21Ar82gmKrvPSRhwKnxqqAxctUCyjr0z6aNcQkCIm_GNmuEpM0XFIngD_d7HFFhaxTtpgr_vq26Y6rIkS8xyqtoTGN9f0crr03JKrNbfmmbGZMC9nF6JEr8ZQbuEUzB6e6GctuLbfVHLhDd_fBVgweJJmNDNnrItfezCn6e6wZNbD9eTPFfYN24Dk8g6rcf-BFXxU3_6JuXvUrPga6PkBCQpQG2_L1qVUrDLhnVZOqtXCLw0--LwELEhCeng3Vz1bwxu5pgLpoWUGjoxEFxN0kDqV54Bhut0AwvCHI96OBHWIUcAknxZg';

test('can hit publish token endpoint', async () => {
    expect.assertions(1);
    try {
        await core.retrievePublishToken(expiredToken);
    } catch (e) {
        expect(e.result).toStrictEqual({
            error: "Not authorized"
        });
    }
});

test('can generate maven settins', async () => {
    await core.generateMavenSettings('/tmp', {
        username: 'test-user',
        token: 'token-123'
    });

    let data = await fs.readFile('/tmp/.m2/settings.xml', 'utf8');
    expect(data).toEqual(
        expect.stringContaining('<username>test-user</username>'),
        expect.stringContaining('<password>token-123</password>')
                        );
});


test('can generate gradle props', async () => {
    await core.generateGradleProps('/tmp', {
        username: 'test-user',
        token: 'token-123'
    });

    let data = await fs.readFile('/tmp/.gradle/gradle.properties', 'utf8');
    expect(data).toMatch(
        `
ARTIFACTORY_USERNAME=test-user
ARTIFACTORY_API_KEY=token-123
`);
});

jest.mock('@actions/core', () => ({
    ...jest.requireActual('@actions/core'),
    exportVariable: jest.fn(),
}));
test('can generate npm config', async () => {
    // Arrange
    const dir = '/tmp';
    const token = {
        username: 'test-user',
        token: 'token-123'
    };

    // Act
    await core.copyNpmConfig(dir, token);

    // Assert
    const data = await fs.readFile(`${dir}/.npmrc-public`, 'utf8');
    // check file exists
    expect(data).toMatch(
        `//packages.atlassian.com/api/npm/npm-public/:_password=\${ARTIFACTORY_PASSWORD_BASE64}
//packages.atlassian.com/api/npm/npm-public/:username=\${ARTIFACTORY_USERNAME}
//packages.atlassian.com/api/npm/npm-public/:email=build-team@atlassian.com
//packages.atlassian.com/api/npm/npm-public/:always-auth=true`
    );
});