import sys
import nysol.mcmd as nm

with open("log", 'w') as logp:
	oldstderr = sys.stderr
	sys.stderr = logp
	nm.mcut(i="xxx",f="v").run()
	sys.stderr = oldstderr
