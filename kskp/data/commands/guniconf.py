import os
import multiprocessing

if 'PORT' not in os.environ:
    port = '5000'
else:
    port = os.environ['PORT']

proc_name = "gunicorn"

# # Server Socket
bind = '0.0.0.0:' + port
# bind = 'unix:/usr/local/var/run/{0}.sock'.format(proc_name)

# Worker Processes
workers = multiprocessing.cpu_count() * 2 + 1
