gunicorn -D -c /kskp/guniconf.py kskp:app
nginx -g "daemon off;"
