require.config({
  shim: {
    underscore: {
      exports: '_'
    },
  },
  paths: {
    requirejs: '../bower_components/requirejs/require',
    jquery: '../bower_components/jquery/jquery',
    underscore: '../bower_components/underscore/underscore',
    'socket.io-aclient': '../bower_components/socket.io-client/dist/socket.io',
    paper: '../bower_components/paper/dist/paper',
  }
});

