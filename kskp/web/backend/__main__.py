import sys
from kskp.web.backend import run

# Flaskを起動する
if len(sys.argv) > 1:
    port = int(sys.argv[1])
else:
    port = 5000

run(port=port)