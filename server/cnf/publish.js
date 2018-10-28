// jsexec ./publish.js [messages,xtrn]
require(system.mods_dir + '/coa/client/lib/coa.js', 'COA');

if (argv.length != 1 || ['messages', 'xtrn'].indexOf(argv[0]) < 0) {
  writeln('Argument must be "messages" or "xtrn"');
}

writeln('Connecting to COA ...');
const coa = new COA();
writeln('Writing update notification ...');
coa.write('coa_cnf', 'update', argv[0], 2);
writeln('Done');
