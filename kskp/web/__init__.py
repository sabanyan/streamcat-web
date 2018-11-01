from flask import Flask

app = Flask('kskp')

@app.route('/data')
def data():
    return 'wowow'

if __name__ == '__main__':
    app.run()
