module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: {
          // We are matching the supported version of pollyjs here:
          // https://github.com/Netflix/pollyjs/blob/2d7f0f33d9f552e78f0dfe81179751b4692357be/.travis.yml#L1-L5
          node: '12'
        }
      }
    ]
  ]
};
