module.exports = function(grunt) {
  var path = require('path');

  grunt.initConfig({
    express: {
    	options: {
    	},
    	dev: {
    		options: {
    			script: 'index.js'
    		}
    	}
    },
    less: {
    	development: {
    		files: {
          "app/styles/desktop.css": "app/styles/desktop.less",
    			"app/styles/mobile.css": "app/styles/mobile.less"
    		}
    	}

    },
	  watch: {
	    express: {
	      files:  ['*.js', 'app/views/*.mustache'],
	      tasks:  [ 'express:dev' ],
	      options: {
	        spawn: false // Without this option specified express won't be reloaded
	      }
	    },
	    less: {
	    	files: "app/styles/*.less",
	    	tasks: ["less:development"]
	    }
    },
    bower: {
      target: {
        rjsConfig: 'app/config.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bower-requirejs');

  grunt.registerTask('default', ['bower']);
  grunt.registerTask('server', ['express:dev', 'watch']);
};