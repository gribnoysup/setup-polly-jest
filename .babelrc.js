module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: {
          // We are matching the supported version of pollyjs here:
          // https://github.com/Netflix/pollyjs/blob/bd3f8196775dbdd424836aa7a8dffa6aa7adafc8/.travis.yml#L2-L4
          node: '10.0.0'
        }
      }
    ]
  ]
};
