from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.5',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        # 'blinker==1.9.0',
        'fastapi==0.116.1',
        # FastAPIでMultipartリクエストを扱う場合に使用する
        'python-multipart==0.0.20',
        'jinja2==3.1.6',
        # FastAPIでDatumをJSONに変換する時に使用する
        'orjson==3.11.3',
        # FastAPIでデコレータ内でRequestオブジェクトを取得できるようにする
        'fastapi-decorators==1.0.19',
        # FastAPIのTestClientが使用する
        'httpx==0.28.1',
        # 'Flask==3.1.0',
        # 'flask_mail',
        'oauthlib==3.3.1',
        'PyJWT==2.10.1',
        # "standard"を指定して"--reload"指定によるCPUの高負荷を下げる
        'uvicorn[standard]==0.35.0'
    ],
)
