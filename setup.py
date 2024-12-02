from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.3.1',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        'blinker==1.6.2',
        'fastapi==0.115.5',
        # FastAPIでMultipartリクエストを扱う場合に使用する
        'python-multipart==0.0.19',
        'jinja2==3.1.4',
        # FastAPIでDatumをJSONに変換する時に使用する
        'orjson==3.10.12'
        # FastAPIでデコレータ内でRequestオブジェクトを取得できるようにする
        'fastapi-decorators==1.0.6'
        # FastAPIのTestClientが使用する
        'httpx==0.28.0'
        # 'Flask==2.3.2',
        # 'flask_mail',
        'oauthlib==3.2.2',
        'PyJWT==2.6.0',
        # "standard"を指定して"--reload"指定によるCPUの高負荷を下げる
        'uvicorn[standard]==0.32.1'
    ],
)
