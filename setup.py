from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.4',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        # 'blinker==1.9.0',
        'fastapi==0.115.7',
        # FastAPIでMultipartリクエストを扱う場合に使用する
        'python-multipart==0.0.20',
        'jinja2==3.1.5',
        # FastAPIでDatumをJSONに変換する時に使用する
        'orjson==3.10.15',
        # FastAPIでデコレータ内でRequestオブジェクトを取得できるようにする
        'fastapi-decorators==1.0.6',
        # FastAPIのTestClientが使用する
        'httpx==0.28.1',
        # 'Flask==3.1.0',
        # 'flask_mail',
        'oauthlib==3.2.2',
        'PyJWT==2.10.1',
        # "standard"を指定して"--reload"指定によるCPUの高負荷を下げる
        'uvicorn[standard]==0.34.0'
    ],
)
