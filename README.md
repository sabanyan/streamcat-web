# kskp-beta

```
docker build -f docker/Dockerfile-small-1-2 -t kskp-beta2 .
docker run -e FLASK_ENV=development -p 5000:5000 -v "$(pwd)"/kskp:/kskp --name kskp-beta2 kskp-beta2
```
