require.config({
  shim: {
    underscore: {
      exports: '_'
    },
    'bower-facebook': {
      exports: 'FB'
    }
  },
  paths: {
    requirejs: '../bower_components/requirejs/require',
    jquery: '../bower_components/jquery/jquery',
    underscore: '../bower_components/underscore/underscore',
    'socket.io-aclient': '../bower_components/socket.io-client/dist/socket.io',
    paper: '../bower_components/paper/dist/paper-full.min',
    fastclick: '../bower_components/fastclick/lib/fastclick',
    'socket.io-client': '../bower_components/socket.io-client/lib/io',
    'bower-facebook': '../bower_components/bower-facebook/all'
  }
});

