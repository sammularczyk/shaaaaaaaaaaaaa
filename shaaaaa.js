/**
* shaaaaa.js
*
* Checks a domain for its certificate algorithm.
*
* Depends on openssl installed and accessible on the PATH.
*/

var exec = require("child_process").exec;

var Shaaa = {
  algorithms: [
    // new gold standards
    "sha256", "sha224", "sha384", "sha512",

    "sha1", // common, but deprecated
    "md5", // old, broken
    "md2" // so old, so broken
  ],

  cmd: function(domain) {

    // I'm sure this is too strict, but it will at least be effective
    // TODO: lighten up
    var escaped = domain.replace(/[^\w\.\-]/g, '')

    // command adapted from http://askubuntu.com/a/201923/3096
    var command = "" +
      // piping into openssl tells it not to hold an open connection
      "echo -n" +
      // connect to given domain on port 443
      " | openssl s_client -connect " + escaped + ":443" +
      // specify hostname in case server uses SNI
      "   -servername " + escaped +
      // yank out just the cert
      " | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p'" +
      // extract x509 details from the cert
      " | openssl x509 -text" +
      // look for just the signature algorithm
      " | grep \"Signature Algorithm\"";

    // console.error(command);

    return command;
  },

  // output will look like:
  // '    Signature Algorithm: sha256WithRSAEncryption\n    Signature Algorithm: sha256WithRSAEncryption\n'
  extract: function(stdout) {
    var line = stdout.split("\n")[0].trim();
    var pieces = line.split(" ");

    var raw = pieces[pieces.length - 1];
    var raw_compare = raw.toLowerCase();

    var answer;
    for (var i=0; i<Shaaa.algorithms.length; i++) {
      var algorithm = Shaaa.algorithms[i];
      if (raw_compare.indexOf(algorithm) == 0) answer = algorithm;
      if (raw_compare == ("ecdsa-with-" + algorithm)) answer = algorithm;
    }
    if (!answer) answer = "unknown";

    var good = (
      (answer == "sha256") ||
      (answer == "sha224") ||
      (answer == "sha384") ||
      (answer == "sha512")
    );

    return {algorithm: answer, raw: raw, good: good};
  },

  from: function(domain, callback, options) {
    if (!options) options = {};

    var cmd = Shaaa.cmd(domain);
    if (options.verbose) console.log(cmd + "\n");

    exec(cmd, function(error, stdout, stderr) {
      if (error) return callback(error);

      // extract data from output, add domain onto data
      var data = Shaaa.extract(stdout, options);
      data.domain = domain;

      if (callback)
        callback(null, data);
      else
        console.log(data);
    });
  }
}

module.exports = Shaaa;