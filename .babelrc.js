module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: {
          // We are matching the supported version of pollyjs here:
          // https://github.com/Netflix/pollyjs/blob/77c42d4576fc113e51b5fca6d1dab5628db23e6b/scripts/rollup/node.config.js#L26-L36
          node: '8.0.0'
        }
      }
    ]
  ]
};
