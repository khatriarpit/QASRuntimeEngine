const { compile } = require('nexe')

const inputAppName = 'WindowBuild.js'
const outputAppName = 'QASEngine'

compile({
  input: inputAppName,
  output: outputAppName,
  build: true, //required to use patches
  build: false,
  ico: 'icon.ico'
}).then((err) => {
  if (err) throw err
  console.log('success')
})