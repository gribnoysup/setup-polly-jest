module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['{__tests__,__mocks__}/**/*.js'],
      env: {
        jest: true
      }
    }
  ]
};
