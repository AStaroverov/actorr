module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['jsdom-worker'],
    transform: {
        '^.+\\.(t|j)s$': '@swc/jest',
    },
    transformIgnorePatterns: ['node_modules/(?!(.+)/)'],
};
